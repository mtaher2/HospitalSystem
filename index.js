import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';  // Import your authentication routes
import patientRoutes from './routes/patientRoutes.js';  // Import your patient routes
import receptionistRoutes from './routes/receptionistRoutes.js';  // Import receptionist routes
import { updateProfilePhoto } from './models/userModel.js';  // Assuming you have a model to update profile photo
import * as up from './middlewares/upload.js';

const app = express();
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

app.use(express.static(path.join(path.resolve(), 'public')));
app.use('/invoices', express.static(path.join(path.resolve(), 'invoices')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret-key', 
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; 
  next();
});

app.get('/', (req, res) => {
  const { alertMessage, alertType } = req.query;
  res.render('login', { 
    errorMessage: null,
    alertMessage: alertMessage,
    alertType: alertType
  });
});
app.use(authRoutes);  
app.use(patientRoutes); 
app.use(receptionistRoutes);

app.use((req, res) => {
  res.status(404).render('404', { errorMessage: 'Page not found!' });
});

// Set up Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(path.resolve(), 'public', 'storage'));  // Save to 'public/storage'
  },
  filename: function(req, file, cb) {
    const userId = req.session.user.User_ID;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    cb(null, fileName);
  }
});

// Initialize multer with storage settings
const upload = multer({ storage: storage });

// Route for handling profile photo upload
app.post('/uploadProfilePhoto', upload.single('profilePhoto'), async (req, res) => {
  if (req.file) {
    const newImagePath = `/storage/${req.file.filename}`;

    try {
      // Update the user's profile photo in the database via the userModel.js
      const updateResult = await updateProfilePhoto(req.session.user.User_ID, newImagePath);

      if (updateResult.affectedRows === 0) {
        res.json({ success: false, message: 'Failed to update profile photo in the database' });
      } else {
        // Update the profile photo in the session
        req.session.user.profilePhoto = newImagePath;
        res.json({ success: true, newImagePath: newImagePath });
      }
    } catch (error) {
      console.error('Database update error:', error);
      res.json({ success: false, message: 'Database update failed' });
    }
  } else {
    res.json({ success: false, message: 'No file uploaded' });
  }
});

app.post('/uploadInsurancePhoto', up.uploadInsurance.single('insurancePhoto'), async (req, res) => {
    if (req.file) {
      const newInsuranceImagePath = `/storage/insurance/${req.file.filename}`;
  
      try {
        // Assuming you have a function to update the insurance image in your patient data model
        const updateResult = await updateInsurancePhoto(req.session.user.User_ID, newInsuranceImagePath);
  
        if (updateResult.affectedRows === 0) {
          res.json({ success: false, message: 'Failed to update insurance photo in the database' });
        } else {
          // Update the insurance photo path in the session or database as needed
          res.json({ success: true, newInsuranceImagePath: newInsuranceImagePath });
        }
      } catch (error) {
        console.error('Database update error:', error);
        res.json({ success: false, message: 'Database update failed' });
      }
    } else {
      res.json({ success: false, message: 'No file uploaded' });
    }
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
