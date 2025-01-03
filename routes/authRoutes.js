import express from 'express';
import { login } from '../controllers/authController.js';
import { handleUpdatePassword } from '../controllers/authController.js';
const router = express.Router();

router.post('/login', login);

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

router.get('/update-password', (req, res) => {
    res.render('login/updatePassword', {
        errorMessage: null,
        stylesheetName: 'styles',
        headerTitle: 'Galala Hospital System',
    });
});

router.post('/update-password', handleUpdatePassword);

// Route to get doctor appointments
router.get('/doctor-apointment' , (req, res) => { 
    const user = req.session.user || null;
    res.render('Doctor/appointments', { user });
});

router.get('/doctor-Home' , (req, res) => { 
    const user = req.session.user || null;
    res.render('Doctor/Home', { user });
});
export default router;
