const express = require("express");
const heroController = require("../Controllers/HeroController.js");
const HeroControllerCard = require("../Controllers/HeroControllerCard.js");

const router = express.Router();

// //Post Method
// router.post("/add", heroController.addHero);

// //Get all Method
// router.get("/getAll", heroController.getAllHeroes);

// //Get by ID Method
// router.get("/getOne/:id", heroController.getHeroById);

// //Update by ID Method
// router.put("/update/:id", heroController.updateHero);

// //Delete by ID Method
// router.delete("/delete/:id", heroController.deleteHero);

//Post Method
// Ruta para manejar el texto
router.post("/addCharacter", HeroControllerCard.addHeroText);

// Ruta para manejar la carga de la imagen
router.post("/addCharacter/image", HeroControllerCard.addHeroImage);

//Get all Method
router.get("/getAllCards", HeroControllerCard.getAllHeroCards);

//Get by ID Method
router.get("/getOneCard/:id", HeroControllerCard.getHeroCardById);

router.get("/image/:id", HeroControllerCard.getHeroImageById);

//Update by ID Method
router.put("/updateCard/:id", HeroControllerCard.updateHeroCard);

//Delete by ID Method
router.delete("/deleteCard/:id", HeroControllerCard.deleteHeroCard);

module.exports = router;
