import express from 'express';
import * as patientController from '../controllers/patientController.js'; 
import checkAuthenticated from '../middlewares/checkAuthenticated.js';
import { uploadInsurance } from '../middlewares/upload.js';
import { getAppointments } from '../controllers/appointmentController.js';
import { cancelAppointment } from "../models/appointmentsmodle.js";
import { getFilteredBills } from "../models/billingModle.js";
import { db } from "../db.js";
import fs from "fs";
import path from "path";
import { generateInvoicePdf } from "../Services/invoiceService.js";
import { selectUserByNationalID } from "../models/userModel.js";
import { setGlobalPatientUserID, globalPatientUserID, globalPatientNationalId} from "../globalVariables.js";
import {setGlobalPatientNationalID} from "../globalVariables.js";
import { renderPatientProfile } from "../controllers/patientController.js";
import { selectInsuranceDetails, updatePatientDetails, updateInsuranceDetails } from '../models/patientModel.js';
import multer from 'multer';

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json()); 
router.get('/reception-add-patient', checkAuthenticated(6), (req, res) => {
    console.log("GET /reception-add-patient route hit");
    res.render('reception/add-patient');
});

router.post(
  '/reception-add-patient',
  checkAuthenticated(6),       
  uploadInsurance.single('insuranceUpload'),  
  patientController.addPatient 
);


router.get('/reception-appointment', checkAuthenticated(6), getAppointments);


router.post('/reception-appointment/:id/cancel', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const result = await cancelAppointment(appointmentId);

    if (result) {
      return res.status(200).json({ message: 'Appointment canceled successfully' });
    } else {
      return res.status(400).json({ error: 'Failed to cancel appointment' });
    }
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/receptionBills', async (req, res) => {
  try {
    const filters = {
      date: req.query.date || null,
      patient: req.query.patient || null,
      status: req.query.status || null, 
    };    

    const bills = await getFilteredBills(filters);

    res.render('reception/receptionBills', { bills, filters });
  } catch (error) {
    console.error("Error rendering reception bills page:", error);
    res.status(500).send("Internal Server Error");
  }
});
const __dirname = path.dirname(new URL(import.meta.url).pathname);
router.post('/receptionBills/:id/changeState', async (req, res) => {
  try {
    const billingId = req.params.id;
    const { paymentMethod, patientId } = req.body;

    if (!paymentMethod || !patientId) {
      return res.status(400).json({ error: "Payment method and Patient ID are required" });
    }

    const invoiceFilePath = path.join(__dirname, `../invoices/invoice_${billingId}.pdf`);
    if (fs.existsSync(invoiceFilePath)) {
      fs.unlinkSync(invoiceFilePath); 
    }

    const updateQuery = `
      UPDATE Billing 
      SET 
        Payment_Status = 'Paid',
        Payment_Method = ?, 
        Date_payment = NOW()
      WHERE Billing_ID = ?;
    `;
    
    const [result] = await db.execute(updateQuery, [paymentMethod, billingId]);

    if (result.affectedRows > 0) {
      
      await generateInvoicePdf(patientId, billingId); 

      res.status(200).json({ message: "Payment status updated and new invoice generated" });
    } else {
      res.status(400).json({ error: "Failed to update payment status" });
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/patient-profile-reception",checkAuthenticated(6) ,async (req, res) => {
  const nationalID = req.query.nationalID;

  try {
    // Validate National ID format
    const nationalIDRegex = /^[34]\d{13}$/;
    if (!nationalIDRegex.test(nationalID)) {
      return res.render("reception/patient-profile-reception", {
        errorMessage: "",
        stylesheetName: "styles", // Add stylesheet if needed
      });
    }

    // Check if National ID exists in the database
    const patientData = await selectUserByNationalID(nationalID);
    if (patientData.length === 0) {
      return res.render("reception/patient-profile-reception", {
        errorMessage: "No patient found with the provided National ID.",
        stylesheetName: "styles", // Add stylesheet if needed
      });
    }

    // Check if the patient's role is 7
    if (patientData[0].Role !== 7) {
      return res.render("reception/patient-profile-reception", {
        errorMessage: "The provided National ID belongs to a non-patient user.",
        stylesheetName: "styles",
      });
    }

    // Set globalPatientUserID and globalPatientNationalID
    const userId = patientData[0].User_ID;
    setGlobalPatientUserID(userId);
    setGlobalPatientNationalID(nationalID);

    // Redirect to the renderPatientProfile function
    req.query.nationalID = nationalID; // Pass the National ID to the next function
    return renderPatientProfile(req, res);
  } catch (error) {
    console.error("Error during patient search:", error);
    return res.status(500).render("error", {
      title: "Error",
      message: "An error occurred while searching for the patient. Please try again later.",
      stylesheetName: "styles",
    });
  }
});

router.get('/update-patient',checkAuthenticated(6) ,async (req, res) => {
  try {
    
    const patient = await selectUserByNationalID(globalPatientNationalId);
    const insurance = await selectInsuranceDetails(globalPatientUserID); // Assuming UserID is available in patient data
    console.log("Patient Data in the update profile:", patient);
    
    // Get alert message from session if it exists
    const alertMessage = req.session.alertMessage;
    const alertType = req.session.alertType;
    
    // Clear the messages after use
    req.session.alertMessage = null;
    req.session.alertType = null;
    
    res.render('reception/updatePatient', { 
      patient: patient[0] || {},
      insurance: insurance || {}, 
      alertMessage: alertMessage,
      alertType: alertType
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching patient data.');
  }
});

const upload = multer({ dest: 'uploads/' });

router.post('/reception-update-patient',checkAuthenticated(6) ,uploadInsurance.single('insuranceUpload'), async (req, res) => {
  try {
    const {
      nationalId, firstName, middleName, lastName, gender,
      phone, email, address, insuranceOrg, coverage, expireDate,
    } = req.body;

    console.log("Patient update national all:", req.body); // Debug incoming data
    console.log("Uploaded file:", req.file); // Debug uploaded file

    // Validate required fields
    if (!nationalId || !firstName || !lastName || !gender || !phone || !address) {
      return res.status(400).send('Missing required fields.');
    }

    const patientUpdateData = {
      nationalId,
      firstName,
      middleName,
      lastName,
      gender,
      phone,
      email,
      address,
    };
    console.log("Prepared Patient Data:", patientUpdateData);

    await updatePatientDetails(patientUpdateData);

    if (insuranceOrg || coverage || expireDate || req.file) {
      const insuranceUpdateData = {
        provider: insuranceOrg,
        coverage,
        expireDate: expireDate ? new Date(expireDate).toISOString().split('T')[0] : null,
        image: req.file?.path,
      };
      console.log("Prepared Insurance Data:", insuranceUpdateData);

      await updateInsuranceDetails(nationalId, insuranceUpdateData);
    }

    // Redirect with success message
    req.session.alertMessage = "Patient information has been updated successfully!";
    req.session.alertType = "success";
    res.redirect('/update-patient');
  } catch (error) {
    console.error("Error updating patient data:", error);
    req.session.alertMessage = "Failed to update patient information. Please try again.";
    req.session.alertType = "error";
    res.redirect('/update-patient');
  }
});

export default router;
