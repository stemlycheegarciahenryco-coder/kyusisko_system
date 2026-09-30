const multer = require('multer');

const MAX_FILE_SIZE_MB = 5; // keep in sync with multerConfig.js and the Supabase bucket

/**
 * Wraps a multer middleware (upload.single / upload.array) so upload errors
 * come back as clean JSON instead of Express's default HTML 500 page.
 *
 * Usage:
 *   router.patch('/students/update-portfolio', verifyToken, isStudent,
 *     handleUpload(upload.array('files', 10)), stdCtrl.updatePortfolio);
 */
const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(413).json({
            error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB per file.`,
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({ error: 'Too many files. Please upload fewer files at once.' });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({ error: 'Unexpected file field in the upload.' });
        default:
          return res.status(400).json({ error: err.message });
      }
    }

    // Errors thrown by fileFilter (e.g. "Invalid file type...") and anything else
    console.error('Upload error:', err.message);
    return res.status(400).json({ error: err.message || 'File upload failed.' });
  });
};

module.exports = handleUpload;