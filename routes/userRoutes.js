
const express = require('express');
const router = express.Router();
const userController = require('../controllers/Usercontroller');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');

// All routes are admin-protected
router.use(protect, adminOnly);
router.get('/fields', userController.getAvailableFields);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/campaigns', userController.assignCampaigns);
router.get('/:id/shareable-link', userController.getShareableLink);

module.exports = router;