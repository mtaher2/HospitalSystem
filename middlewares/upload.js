import multer from 'multer';
import path from 'path';

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify where the uploaded files will be stored
    cb(null, path.join(path.resolve(), 'public', 'storage'));  // Save files to 'public/storage' directory
  },
  filename: (req, file, cb) => {
    // Set the filename format, using the user ID and a timestamp to ensure uniqueness
    const userId = req.session.user.User_ID;  // Get user ID from session
    const fileExtension = path.extname(file.originalname);  // Get file extension (e.g., .jpg, .png)
    const fileName = `${userId}_${Date.now()}${fileExtension}`;  // Unique file name based on user ID and timestamp
    cb(null, fileName);  // Save file with this unique name
  },
});

// Initialize Multer with the storage configuration
const upload = multer({ storage: storage });

const insuranceStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.join(path.resolve(), 'public', 'storage', 'insurance'));  // Save to 'public/storage/insurance'
    },
    filename: function(req, file, cb) {
      const userId = req.session.user.User_ID;  // Or use patient ID if applicable
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}_${Date.now()}${fileExtension}`;
      cb(null, fileName);
    }
  });
  
  // Initialize multer for insurance photo upload
  const uploadInsurance = multer({ storage: insuranceStorage });

export { upload , uploadInsurance };  // Export the Multer upload instance to use in routes
