const express = require("express");
const controller = require("../src/controllers/heroController");
const asyncHandler = require("../src/middleware/asyncHandler");
const { validateHero } = require("../src/middleware/validateHero");
const authenticate = require("../src/middleware/authenticate");

const router = express.Router();

// Deprecated compatibility routes. New clients should use /api/v1/heroes.
router.post("/addCharacter", authenticate, validateHero, asyncHandler(controller.create));
router.post("/addCharacter/image", authenticate, (req, res, next) => {
  req.params.id = req.body._id;
  return asyncHandler(controller.uploadImage)(req, res, next);
});
router.get("/getAllCards", asyncHandler(controller.listLegacy));
router.get("/getOneCard/:id", asyncHandler(controller.getOneLegacy));
router.get("/image/:id", asyncHandler(controller.getImage));
router.put("/updateCard/:id", authenticate, validateHero, asyncHandler(controller.update));
router.delete("/deleteCard/:id", authenticate, asyncHandler(controller.remove));

module.exports = router;
