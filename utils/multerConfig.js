import path from 'path';
import multer from 'multer';

// Set up Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(path.resolve(), 'public', 'storage'));  // Save to 'public/storage'
  },
  filename: function(req, file, cb) {
    const userId = req.session.user.User_ID;  // Use correct session variable for user ID
    const fileExtension = path.extname(file.originalname);  // Get file extension (e.g., .jpg)
    const fileName = `${userId}_${Date.now()}${fileExtension}`;  // Unique filename
    cb(null, fileName);
  }
});

// Initialize multer with storage settings
const upload = multer({ storage: storage });

// Export upload directly
export { upload };
