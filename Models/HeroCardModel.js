const mongoose = require("mongoose");

const heroCardSchema = new mongoose.Schema(
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
    Details: {
      Powers: { type: String, required: true },
      Weakness: { type: String, required: true },
    },
    Image: {
      data: Buffer,
      contentType: String,
    },
  },
  { versionKey: false }
);
module.exports = mongoose.model("heroCard", heroCardSchema, "HeroesCards");
