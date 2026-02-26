// const express = require('express');
// const router = express.Router();
// const campaignController = require('../controllers/campaignController');

// // GET all campaigns
// router.get('/', campaignController.getAllCampaigns);

// // GET single campaign by ID
// router.get('/:id', campaignController.getCampaignById);

// // POST create new campaign
// router.post('/', campaignController.createCampaign);

// // PUT update campaign
// router.put('/:id', campaignController.updateCampaign);

// // DELETE campaign
// router.delete('/:id', campaignController.deleteCampaign);

// // POST duplicate campaign
// router.post('/:id/duplicate', campaignController.duplicateCampaign);

// // PATCH toggle campaign active status
// router.patch('/:id/toggle', campaignController.toggleCampaignActive);

// module.exports = router;

const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const {
  protect,
  adminOnly,
  filterViewerCampaigns,
} = require("../middleware/authMiddleware.js");

// Debug: catch missing exports early with clear error messages
const requiredController = [
  "getAllCampaigns",
  "getCampaignById",
  "createCampaign",
  "updateCampaign",
  "deleteCampaign",
  "duplicateCampaign",
  "toggleCampaignActive",
];
requiredController.forEach((fn) => {
  if (typeof campaignController[fn] !== "function") {
    throw new Error(
      `campaignController is missing export: "${fn}" — did you replace the old campaignController.js with the new one?`,
    );
  }
});
if (typeof filterViewerCampaigns !== "function") {
  throw new Error(
    'authMiddleware is missing export: "filterViewerCampaigns" — did you add the new authMiddleware.js?',
  );
}

// All routes require login
router.use(protect);

// GET - both admin and viewer (with viewer filtering)
router.get("/", filterViewerCampaigns, campaignController.getAllCampaigns);
router.get("/:id", filterViewerCampaigns, campaignController.getCampaignById);

// Write routes - admin only
router.post("/", adminOnly, campaignController.createCampaign);
router.put("/:id", adminOnly, campaignController.updateCampaign);
router.delete("/:id", adminOnly, campaignController.deleteCampaign);
router.post("/:id/duplicate", adminOnly, campaignController.duplicateCampaign);
router.patch("/:id/toggle", adminOnly, campaignController.toggleCampaignActive);

module.exports = router;
