const express = require("express");
const heroController = require("../Controllers/HeroController.js");

const router = express.Router();

//Post Method
router.post("/add", heroController.addHero);

//Get all Method
router.get("/getAll", heroController.getAllHeroes);

//Get by ID Method
router.get("/getOne/:id", heroController.getHeroById);

//Update by ID Method
router.put("/update/:id", heroController.updateHero);

//Delete by ID Method
router.delete("/delete/:id", heroController.deleteHero);

module.exports = router;
