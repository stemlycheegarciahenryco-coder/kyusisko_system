const multer = require('multer');

// ✅ SWITCHED TO MEMORY STORAGE: Files will now be processed as temporary buffers in RAM
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/webp', // Added WebP support since we allowed it in your bucket
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, PNG, WEBP, and DOCX are allowed!'), false);
        }
    }
});

module.exports = upload;