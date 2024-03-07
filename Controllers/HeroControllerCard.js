const mongoose = require("mongoose");
const heroCardModel = require("../Models/HeroCardModel.js");

// POST
const addHeroText = async (req, res) => {
  try {
    const hero = new heroCardModel({
      _id: new mongoose.Types.ObjectId(),
      Name: req.body.Name,
      Description: req.body.Description,
      Details: {
        Powers: req.body.Details.Powers,
        Weakness: req.body.Details.Weakness,
      },
    });

    const result = await hero.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST IMG
const addHeroImage = async (req, res) => {
  try {
    if (!req.files || !req.files.Image || !req.body._id) {
      return res.status(400).json({ message: "Missing data" });
    }

    const hero = await heroCardModel.findById(req.body._id);
    console.log(hero);

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    hero.Image = {
      data: req.files.Image.data,
      contentType: req.files.Image.mimetype,
    };

    const result = await hero.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//GetAll
const getAllHeroCards = async (req, res) => {
  try {
    const heroes = await heroCardModel.find();
    res.status(200).json(heroes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//getById
const getHeroCardById = async (req, res) => {
  const id = req.params.id;
  try {
    const hero = await heroCardModel.findById(id);

    if (!hero) {
      return res.status(400).json({ message: "Hero not Found" });
    }
    res.status(200).json(hero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getHeroImageById = async (req, res) => {
  try {
    const hero = await heroCardModel.findById(req.params.id);

    if (!hero || !hero.Image) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    res.set("Content-Type", hero.Image.contentType);
    res.send(hero.Image.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

//Put
const updateHeroCard = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedHero = await heroCardModel.findByIdAndUpdate(
      id,
      {
        $set: {
          Name: req.body.Name,
          Description: req.body.Description,
          Details: {
            Powers: req.body.Details.Powers,
            Weakness: req.body.Details.Weakness,
          },
        },
      },
      { new: true }
    );

    if (!updatedHero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    res.status(200).json(updatedHero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Delete
const deleteHeroCard = async (req, res) => {
  const id = req.params.id;
  try {
    heroCardModel
      .deleteOne({ _id: id })
      .then((deleteHero) => res.status(200).json(deleteHero));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addHeroText,
  addHeroImage,
  getAllHeroCards,
  getHeroCardById,
  updateHeroCard,
  deleteHeroCard,
  getHeroImageById,
};
