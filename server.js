const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Set storage engine for multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/storage'); // Folder where the image will be saved
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to file name to avoid name collisions
    }
});

const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for uploading profile photo
app.post('/uploadProfilePhoto', upload.single('profilePhoto'), (req, res) => {
    if (req.file) {
        // Here you would update the user's profile photo path in the database
        const newImagePath = `/storage/${req.file.filename}`;

        // Example: Update user profile photo in the database (pseudo code)
        // db.query('UPDATE users SET profilePhoto = ? WHERE id = ?', [newImagePath, req.user.id]);

        res.json({ success: true, newImagePath: newImagePath });
    } else {
        res.json({ success: false, message: 'No file uploaded' });
    }
});

// Set up server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
