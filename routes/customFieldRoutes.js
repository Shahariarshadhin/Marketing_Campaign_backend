const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/customFieldController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',     ctrl.getAllCustomFields);
router.get('/:id',  ctrl.getCustomFieldById);
router.post('/',    adminOnly, ctrl.createCustomField);
router.put('/:id',  adminOnly, ctrl.updateCustomField);
router.delete('/:id', adminOnly, ctrl.deleteCustomField);

module.exports = router;