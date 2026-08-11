const multer = require('multer');

// 1. Use memory storage (holds the file buffer in memory for Supabase)
const storage = multer.memoryStorage();

// 2. Allowed file types filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, PNG, and WebP images are allowed'), false);
    }
};

// 3. Create Multer instance
const uploadOrgPic = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = uploadOrgPic;