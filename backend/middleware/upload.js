const multer = require('multer');

// ✅ SWITCHED TO MEMORY STORAGE: Stops files from cluttering your Render server storage
const storage = multer.memoryStorage();

// File filter — allows images, PDFs, and Word documents
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = /application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword|image\/jpeg|image\/png|image\/webp/i;

  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed! (Received: ${file.mimetype}). Only PDF, DOCX, and common images are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // ✅ Fixed: Cleaned up your comment limit to accurately match 10MB
});

module.exports = upload;