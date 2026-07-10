const express = require("express");
const controller = require("../controllers/heroController");
const asyncHandler = require("../middleware/asyncHandler");
const { validateHero } = require("../middleware/validateHero");

const router = express.Router();

router.route("/")
  .get(asyncHandler(controller.list))
  .post(validateHero, asyncHandler(controller.create));
router.route("/:id")
  .get(asyncHandler(controller.getOne))
  .put(validateHero, asyncHandler(controller.update))
  .delete(asyncHandler(controller.remove));
router.route("/:id/image")
  .get(asyncHandler(controller.getImage))
  .put(asyncHandler(controller.uploadImage));

module.exports = router;
