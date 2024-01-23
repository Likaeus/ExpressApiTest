const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    required: true,
    type: String,
  },
});
module.exports = mongoose.model("heroData", heroSchema);
