import express from 'express';
import { login } from '../controllers/authController.js';
const router = express.Router();

// Login route
router.post('/login', login);

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/');
        }
        res.redirect('/'); // Redirect to login page after logout
    });
});

export default router;
