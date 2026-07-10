require("dotenv").config();

const mongoose = require("mongoose");
const serverless = require("serverless-http");

const app = require("../../src/app");
const config = require("../../src/config");

let connectionPromise = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.databaseUrl, {
        serverSelectionTimeoutMS: 5000,
      })
      .catch((error) => {
        connectionPromise = null;
        console.error("MongoDB connection error:", error);
        throw error;
      });
  }

  await connectionPromise;
}

const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const requestPath = event.path || "";

  // La ruta de salud no necesita conectarse a MongoDB
  if (!requestPath.endsWith("/health")) {
    await connectToDatabase();
  }

  return expressHandler(event, context);
};
