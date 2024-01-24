const mongoose = require("mongoose");
const heroModel = require("../Models/heroModel.js");

// POST
const addHero = async (req, res) => {
  const hero = new heroModel({
    _id: new mongoose.Types.ObjectId(),
    Name: req.body.Name,
  });
  try {
    const result = await hero.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//GetAll
const getAllHeroes = async (req, res) => {
  try {
    const heroes = await heroModel.find();
    res.status(200).json(heroes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//getById
const getHeroById = async (req, res) => {
  const id = req.params.id;
  try {
    const hero = await heroModel.findById(id);

    if (!hero) {
      return res.status(400).json({ message: "Hero not Found" });
    }
    res.status(200).json(hero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Put
const updateHero = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedHero = await heroModel.updateOne(
      { _id: id },
      { $set: { Name: req.body.Name } }
    );

    if (updatedHero.n === 0) {
      return res.status(404).json({ message: "Hero not found" });
    }

    res.status(200).json(updatedHero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Delete
const deleteHero = async (req, res) => {
  const id = req.params.id;
  try {
    heroModel
      .deleteOne({ _id: id })
      .then((deleteHero) => res.status(200).json(deleteHero));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addHero, getAllHeroes, getHeroById, updateHero, deleteHero };
