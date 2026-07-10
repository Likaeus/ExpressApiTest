const express = require("express");
const controller = require("../src/controllers/heroController");
const asyncHandler = require("../src/middleware/asyncHandler");
const { validateHero } = require("../src/middleware/validateHero");

const router = express.Router();

// Deprecated compatibility routes. New clients should use /api/v1/heroes.
router.post("/addCharacter", validateHero, asyncHandler(controller.create));
router.post("/addCharacter/image", (req, res, next) => {
  req.params.id = req.body._id;
  return asyncHandler(controller.uploadImage)(req, res, next);
});
router.get("/getAllCards", asyncHandler(controller.list));
router.get("/getOneCard/:id", asyncHandler(controller.getOne));
router.get("/image/:id", asyncHandler(controller.getImage));
router.put("/updateCard/:id", validateHero, asyncHandler(controller.update));
router.delete("/deleteCard/:id", asyncHandler(controller.remove));

module.exports = router;
