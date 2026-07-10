const express = require("express");
const controller = require("../controllers/heroController");
const asyncHandler = require("../middleware/asyncHandler");
const { validateHero } = require("../middleware/validateHero");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.get("/mine", authenticate, asyncHandler(controller.listMine));
router.route("/")
  .get(asyncHandler(controller.list))
  .post(authenticate, validateHero, asyncHandler(controller.create));
router.route("/:id")
  .get(asyncHandler(controller.getOne))
  .put(authenticate, validateHero, asyncHandler(controller.update))
  .delete(authenticate, asyncHandler(controller.remove));
router.route("/:id/image")
  .get(asyncHandler(controller.getImage))
  .put(authenticate, asyncHandler(controller.uploadImage));

module.exports = router;
