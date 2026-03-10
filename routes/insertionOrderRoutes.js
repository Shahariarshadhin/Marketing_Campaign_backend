const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams for :campaignId
const ctrl    = require('../controllers/InsertionOrderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',                    ctrl.getOrders);
router.get('/:id',                 ctrl.getOrder);
router.post('/',      adminOnly,   ctrl.createOrder);
router.put('/:id',    adminOnly,   ctrl.updateOrder);
router.delete('/:id', adminOnly,   ctrl.deleteOrder);
router.patch('/:id/toggle', adminOnly, ctrl.toggleOrder);

module.exports = router;