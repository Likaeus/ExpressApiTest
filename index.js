require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./src/app");
const config = require("./src/config");

let server;

async function start() {
  try {
    await mongoose.connect(config.databaseUrl);
    console.log("Database connected");

    server = app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Could not start the API:", error.message);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
}

process.on("SIGINT", () => shutdown("SIGINT").finally(() => process.exit(0)));
process.on("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit(0)));

start();
