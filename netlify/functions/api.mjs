import "dotenv/config";

import { withLambda } from "@netlify/aws-lambda-compat";
import mongoose from "mongoose";
import serverless from "serverless-http";

import app from "../../src/app.js";
import config from "../../src/config.js";
import Hero from "../../Models/HeroCardModel.js";
import imageStreaming from "../../src/netlify/imageStreaming.js";

const { imageIdFromPath, corsHeaders, imageBuffer, bufferStream } = imageStreaming;

let connectionPromise = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.databaseUrl, { serverSelectionTimeoutMS: 5000 })
      .catch((error) => {
        connectionPromise = null;
        console.error("MongoDB connection error:", error);
        throw error;
      });
  }

  await connectionPromise;
}

const expressHandler = serverless(app, {
  basePath: "/.netlify/functions/api",
});

const legacyHandler = withLambda(async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const requestPath = event.path || "";
  const isCorsPreflight = event.httpMethod === "OPTIONS";

  if (!isCorsPreflight && !requestPath.endsWith("/health")) {
    await connectToDatabase();
  }

  return expressHandler(event, context);
});

async function streamHeroImage(request, imageId) {
  const headers = corsHeaders(request.headers.get("origin"), config.corsOrigin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    await connectToDatabase();
    const hero = await Hero.findById(imageId).select("+Image.data Image.contentType updatedAt").lean();

    if (!hero?.Image?.data) {
      return Response.json(
        { error: { code: "IMAGE_NOT_FOUND", message: "Image not found" } },
        { status: 404, headers },
      );
    }

    const bytes = imageBuffer(hero.Image.data);
    const etag = `\"${hero._id}-${new Date(hero.updatedAt || 0).getTime()}-${bytes.length}\"`;
    const imageHeaders = {
      ...headers,
      "Content-Type": hero.Image.contentType || "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      ETag: etag,
    };

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: imageHeaders });
    }

    if (request.method === "HEAD") {
      return new Response(null, { status: 200, headers: imageHeaders });
    }

    return new Response(bufferStream(bytes), { status: 200, headers: imageHeaders });
  } catch (error) {
    console.error("Could not stream hero image:", error);
    return Response.json(
      { error: { code: "IMAGE_DELIVERY_FAILED", message: "Could not load image" } },
      { status: 500, headers },
    );
  }
}

export default async function handler(request, context) {
  const imageId = imageIdFromPath(new URL(request.url).pathname);
  if (imageId && ["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return streamHeroImage(request, imageId);
  }

  return legacyHandler(request, context);
}
