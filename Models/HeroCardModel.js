const mongoose = require("mongoose");

const heroCardSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true, trim: true, maxlength: 120 },
    Description: { type: String, required: true, trim: true, maxlength: 2000 },
    Details: {
      Powers: { type: String, required: true, trim: true, maxlength: 1000 },
      Weakness: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    Image: {
      data: { type: Buffer, select: false },
      contentType: String,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
  },
  { versionKey: false, timestamps: true }
);

heroCardSchema.index({ Name: 1 });

module.exports = mongoose.model("HeroCard", heroCardSchema, "HeroesCards");
