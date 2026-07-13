const mongoose = require("mongoose");
const config = require("../config");

const campaignSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    creatorName: { type: String, trim: true, maxlength: 100, default: "" },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, maxlength: 150 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    system: { type: String, required: true, trim: true, maxlength: 80 },
    genres: [{ type: String, trim: true, maxlength: 40 }],
    tone: { type: String, required: true, trim: true, maxlength: 80 },
    status: {
      type: String,
      enum: ["planning", "active", "paused", "completed"],
      default: "planning",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "private",
      index: true,
    },
    playerCount: {
      min: { type: Number, required: true, min: 1, max: 20 },
      max: { type: Number, required: true, min: 1, max: 20 },
    },
    schedule: { type: String, trim: true, maxlength: 120, default: "" },
    contentWarnings: [{ type: String, trim: true, maxlength: 80 }],
    map: {
      provider: { type: String, enum: ["seed-preview", "azgaar"], default: "seed-preview" },
      seed: { type: String, required: true, trim: true, maxlength: 80 },
      generatorVersion: { type: String, trim: true, maxlength: 40, default: "epic-preview-1" },
      parameters: {
        size: { type: String, enum: ["small", "medium", "large"], default: "medium" },
        landform: { type: String, enum: ["continents", "archipelago", "islands", "pangea"], default: "continents" },
        climate: { type: String, enum: ["temperate", "cold", "arid", "tropical"], default: "temperate" },
      },
    },
    mapAssets: {
      preview: { data: { type: Buffer, select: false }, contentType: String },
      source: { data: { type: Buffer, select: false }, contentType: String },
    },
    schemaVersion: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

campaignSchema.index({ visibility: 1, createdAt: -1 });
campaignSchema.index({ name: "text", shortDescription: "text", description: "text" });
campaignSchema.index({ ownerId: 1, slug: 1 }, { unique: true });

const campaignDatabase = mongoose.connection.useDb(config.campaignDatabaseName, { useCache: true });

module.exports = campaignDatabase.model("Campaign", campaignSchema, config.campaignCollectionName);
