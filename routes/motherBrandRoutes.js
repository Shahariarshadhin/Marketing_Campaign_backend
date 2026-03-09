const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/MotherBrandController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/',                      ctrl.getAllBrands);
router.get('/:id',                   ctrl.getBrandById);
router.get('/:id/campaigns',         ctrl.getBrandCampaigns);
router.post('/',    adminOnly, upload.single('logo'), ctrl.createBrand);
router.put('/:id',  adminOnly, upload.single('logo'), ctrl.updateBrand);
router.delete('/:id', adminOnly,     ctrl.deleteBrand);

module.exports = router;