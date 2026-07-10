const mongoose = require("mongoose");
const config = require("../config");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

const userDatabase = mongoose.connection.useDb(config.userDatabaseName, { useCache: true });

module.exports = userDatabase.model("User", userSchema, config.userCollectionName);
