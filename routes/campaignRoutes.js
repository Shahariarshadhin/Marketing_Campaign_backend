
const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// GET all campaigns
router.get('/', campaignController.getAllCampaigns);

// GET single campaign by ID
router.get('/:id', campaignController.getCampaignById);

// POST create new campaign
router.post('/', campaignController.createCampaign);

// PUT update campaign
router.put('/:id', campaignController.updateCampaign);

// DELETE campaign
router.delete('/:id', campaignController.deleteCampaign);

// POST duplicate campaign
router.post('/:id/duplicate', campaignController.duplicateCampaign);

// PATCH toggle campaign active status
router.patch('/:id/toggle', campaignController.toggleCampaignActive);

module.exports = router;