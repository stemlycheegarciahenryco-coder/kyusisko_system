const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Specialized folder for Org Profiles to keep them separate from student docs
const uploadDir = 'uploads/profiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // We use 'org' prefix here so it doesn't conflict with student files
    const orgId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    
    // Result: org_5_1714123456789.png
    cb(null, `org_${orgId}_${timestamp}${ext}`);
  }
});

// Reuse your existing filter logic for safety
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp' // Added WebP support
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Send a clear error message back
        cb(new Error('Only JPG, JPEG, PNG, and WebP images are allowed'), false);
    }
};

const uploadOrgPic = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB is plenty for a logo
});

module.exports = uploadOrgPic;