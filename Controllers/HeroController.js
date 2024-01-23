const mongoose = require("mongoose");
const heroData = require("../Models/heroModel.js");

const addHero = async (req, res) => {
  const hero = new heroData({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
  });
  try {
    const result = await hero.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllHeroes = async (req, res) => {
  heroData.find().then((heroes) =>
    res
      .status(200)
      .json(heroes)
      .catch((err) => res.status(500).json({ error: err }))
  );
};

module.exports = { addHero, getAllHeroes };
