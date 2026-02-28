const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/campaignContentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// memoryStorage — file stays in RAM as buffer, piped straight to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-ms-wmv'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

router.use(protect);

// GET — admin and viewer can read
router.get('/:campaignId', ctrl.getContent);

// Admin only writes
router.put('/:campaignId/links', adminOnly, ctrl.updateLinks);
router.delete('/:campaignId/media/:mediaId', adminOnly, ctrl.deleteMedia);

// POST with multer — must come AFTER express.json() routes to avoid conflict
router.post(
  '/:campaignId',
  adminOnly,
  (req, res, next) => upload.array('media', 20)(req, res, (err) => handleMulterError(err, req, res, next)),
  ctrl.saveContent
);

module.exports = router;