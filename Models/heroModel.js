const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    Name: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
      required: true,
    },
  },

  { versionKey: false }
);
module.exports = mongoose.model("heroes", heroSchema, "Heroes");
