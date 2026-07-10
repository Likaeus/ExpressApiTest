const express = require("express");
const controller = require("../controllers/campaignController");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const { validateCampaign } = require("../middleware/validateCampaign");

const router = express.Router();
router.get("/mine", authenticate, asyncHandler(controller.listMine));
router.put("/:id/map", authenticate, asyncHandler(controller.uploadMap));
router.get("/:id/map/preview", asyncHandler(controller.getMapPreview));
router.get("/:id/map/preview/mine", authenticate, asyncHandler(controller.getOwnedMapPreview));
router.route("/").get(asyncHandler(controller.list)).post(authenticate, validateCampaign, asyncHandler(controller.create));
router.route("/:id")
  .get(asyncHandler(controller.getOne))
  .put(authenticate, validateCampaign, asyncHandler(controller.update))
  .delete(authenticate, asyncHandler(controller.remove));

module.exports = router;
