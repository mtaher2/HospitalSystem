import express from 'express';
import * as patientController from '../controllers/patientController.js'; // Import the controller
import checkAuthenticated from '../middlewares/checkAuthenticated.js';
import { uploadInsurance } from '../middlewares/upload.js';

const router = express.Router();

router.get('/reception-add-patient', checkAuthenticated(2), (req, res) => {
    console.log("GET /reception-add-patient route hit");
    res.render('reception/add-patient');
});

// POST route to add a new patient by the receptionist
router.post(
  '/reception-add-patient',
  checkAuthenticated(2),         // Authentication middleware
  uploadInsurance.single('insuranceUpload'),  // Middleware to handle file upload
  patientController.addPatient // Controller to handle adding the patient
);

export default router;
