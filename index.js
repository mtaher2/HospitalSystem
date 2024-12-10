import express from 'express';
import { selectUser } from './models/userModel.js';  // Adjust the path if needed
import path from 'path';
import { fileURLToPath } from 'url';

// Use fileURLToPath to get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to select a user by User_ID
app.get('/user/:id', async (req, res) => {
    const userID = req.params.id;

    console.log(`Request to select user with ID: ${userID}`); // Log request

    try {
        const results = await selectUser(userID);
        console.log('Select user results:', results); // Log results from the query
        if (results.length > 0) {
            // If user is found, send back user data (you can render a page or return JSON)
            res.render('userView', { user: results[0] });
        } else {
            // If no user is found, send a 404 response
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error selecting user:', err);
        res.status(500).json({ error: 'Error selecting user' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});