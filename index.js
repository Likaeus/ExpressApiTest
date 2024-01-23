require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes/routes");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8000;

mongoose.connect(process.env.DATABASE_URL);

const database = mongoose.connection;
database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

app.use(cors());

app.listen(() => console.log(`it's alive on http://localhost:${port}`));

app.use("/api", routes);
