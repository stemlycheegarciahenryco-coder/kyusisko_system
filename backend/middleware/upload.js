const multer = require('multer');
const path = require('path');
const fs = require('fs');

// create folders if they don't exist yet
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/others';

    const mimetype = file.mimetype;
    const fieldname = file.fieldname;

    if (mimetype === 'application/pdf') {
      folder = 'uploads/documents';
    } else if (mimetype.startsWith('image/')) {
      folder = 'uploads/images';
    }

    ensureDir(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const studentId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_') // remove special chars
      .toLowerCase();

    // format: student_1_report_card_1714123456789.pdf
    cb(null, `student_${studentId}_${safeName}_${timestamp}${ext}`);
  }
});

// file filter — only allow images and PDFs
const fileFilter = (req, file, cb) => {
  // 1. Define allowed MimeTypes
  // application/pdf = PDF
  // application/vnd.openxmlformats-officedocument.wordprocessingml.document = DOCX
  // application/msword = older .DOC files
  const allowedMimeTypes = /application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword/i;
  
  // 2. Define allowed Extensions
  const allowedExtensions = /pdf|docx|doc/i;

  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    // Helpful error message for the student
    cb(new Error(`File type not allowed! (Received: ${file.mimetype}). Only PDF and DOCX files are allowed.`), false);
  }
};

// size limit — 10MB is usually safer for documents with many images/tables
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Increased to 10MB
});

module.exports = upload;