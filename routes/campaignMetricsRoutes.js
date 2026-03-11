const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/CampaignMetricsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

// Bulk fetch — must be before /:campaignId to avoid param collision
router.post('/bulk-by-date',       ctrl.getBulkByDate);   // fetch many campaigns' data for a date
router.post('/bulk-by-range',      ctrl.getBulkByRange);  // date range, aggregated sum per campaign

router.get('/:campaignId',         ctrl.getMetrics);   // admin + viewer
router.get('/:campaignId/all',     ctrl.getAllRecords);    // all records (for entry panel)
router.get('/:campaignId/summary', ctrl.getSummary);   // admin + viewer
router.post('/:campaignId',        adminOnly, ctrl.upsertMetrics);  // single day
router.post('/:campaignId/bulk',   adminOnly, ctrl.bulkUpsert);     // multiple days
router.delete('/:campaignId/:recordId', adminOnly, ctrl.deleteMetrics);

module.exports = router;