const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/CampaignMetricsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:campaignId',         ctrl.getMetrics);   // admin + viewer
router.get('/:campaignId/summary', ctrl.getSummary);   // admin + viewer
router.post('/:campaignId',        adminOnly, ctrl.upsertMetrics);  // single day
router.post('/:campaignId/bulk',   adminOnly, ctrl.bulkUpsert);     // multiple days
router.delete('/:campaignId/:recordId', adminOnly, ctrl.deleteMetrics);

module.exports = router;