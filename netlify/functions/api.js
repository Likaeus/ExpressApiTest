require("dotenv").config();

const mongoose = require("mongoose");
const serverless = require("serverless-http");

const app = require("../../src/app");
const config = require("../../src/config");

let connectionPromise = null;

async function connectToDatabase() {
  // 1 significa que Mongoose ya está conectado
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Evita crear varias conexiones al mismo tiempo
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(config.databaseUrl).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

const expressHandler = serverless(app, {
  basePath: "/.netlify/functions/api",
});

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await connectToDatabase();

  return expressHandler(event, context);
};
