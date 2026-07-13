import "dotenv/config";

import { withLambda } from "@netlify/aws-lambda-compat";
import mongoose from "mongoose";
import serverless from "serverless-http";

import app from "../../src/app.js";
import config from "../../src/config.js";
import Hero from "../../Models/HeroCardModel.js";
import Campaign from "../../src/models/Campaign.js";
import imageStreaming from "../../src/netlify/imageStreaming.js";
import lambdaResponse from "../../src/netlify/lambdaResponse.js";

const { imageIdFromPath, corsHeaders, imageBuffer, bufferStream } = imageStreaming;
const { normalizeLambdaResponse } = lambdaResponse;

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

  const response = await expressHandler(event, context);
  return normalizeLambdaResponse(response);
});

async function streamHeroImage(request, imageId) {
  const headers = corsHeaders(request.headers.get("origin"), config.corsOrigin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    await connectToDatabase();
    const hero = await Hero.findOne({ _id: imageId, visibility: { $ne: "private" } }).select("+Image.data Image.contentType updatedAt").lean();

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

function campaignPreviewId(pathname) {
  return pathname.match(/\/api\/v1\/campaigns\/([a-f\d]{24})\/map\/preview\/?$/i)?.[1] || null;
}

async function streamCampaignPreview(request, campaignId) {
  const headers = {
    ...corsHeaders(request.headers.get("origin"), config.corsOrigin),
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  try {
    await connectToDatabase();
    const campaign = await Campaign.findOne({ _id: campaignId, visibility: "public" })
      .select("+mapAssets.preview.data mapAssets.preview.contentType updatedAt").lean();
    if (!campaign?.mapAssets?.preview?.data) return Response.json(
      { error: { code: "MAP_NOT_FOUND", message: "Map preview not found" } },
      { status: 404, headers },
    );
    const bytes = imageBuffer(campaign.mapAssets.preview.data);
    const etag = `"${campaign._id}-${new Date(campaign.updatedAt || 0).getTime()}-${bytes.length}"`;
    const mapHeaders = {
      ...headers,
      "Content-Type": "image/svg+xml",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:",
      ETag: etag,
    };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: mapHeaders });
    if (request.method === "HEAD") return new Response(null, { status: 200, headers: mapHeaders });
    return new Response(bufferStream(bytes), { status: 200, headers: mapHeaders });
  } catch (error) {
    console.error("Could not stream campaign map:", error);
    return Response.json({ error: { code: "MAP_DELIVERY_FAILED", message: "Could not load map" } }, { status: 500, headers });
  }
}

export default async function handler(request, context) {
  const pathname = new URL(request.url).pathname;
  const imageId = imageIdFromPath(pathname);
  if (imageId && ["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return streamHeroImage(request, imageId);
  }

  const campaignId = campaignPreviewId(pathname);
  if (campaignId && ["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return streamCampaignPreview(request, campaignId);
  }

  return legacyHandler(request, context);
}
