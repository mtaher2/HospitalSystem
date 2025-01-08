import express from "express";
import checkAuthenticated from "../middlewares/checkAuthenticated.js";
import { db } from "../db.js";
import {getNotification} from "../models/announcementModel.js";
import * as pharmacyModel from "../models/pharmacyModel.js";
const router = express.Router();
router.use(express.json());

// Route to render the order management page
router.get('/pharmacy-home-page',checkAuthenticated(4),async (req, res) => {
    const userId = req.session.user.User_ID;
    try {
      const medications = await pharmacyModel.getAllMedications();
      const notifications = await getNotification(userId);
      res.render('Pharmacy/PharmacyHome', { medications, notifications });
    } catch (error) {
      res.status(500).send('Error loading data: ' + error.message);
    }
  });
  
  router.get('/pharmacy/filter', async (req, res) => {
    const { name } = req.query;

    try {
        const medications = await pharmacyModel.getFilteredMedications(name || '');
        res.json(medications); // Correctly sends JSON response
    } catch (error) {
        res.status(500).json({ error: error.message }); // Always return JSON on error
    }
});

router.get('/prescriptions-dashbard',checkAuthenticated(4), async (req, res) => {
    try {
        const prescriptions = await pharmacyModel.getGroupedPrescriptions();
        res.render('Pharmacy/PrescriptionManagement', { prescriptions });
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
});

router.post('/create-billing',checkAuthenticated(4),async (req, res) => {
    const { prescriptions } = req.body;
    
    try {
      const result = await pharmacyModel.createBillingAndUpdatePrescriptions(prescriptions);
      if (result.success) {
        return res.json({ success: true, message: 'Billing created and prescriptions updated' });
      } else {
        return res.status(500).json({ message: 'Failed to create billing' });
      }
    } catch (error) {
      console.error('Error in /create-billing route:', error);
      return res.status(500).json({ message: error.message });
    }
});  

router.get('/prescription-pharmacy',checkAuthenticated(4), (req, res) => {
    console.log('Prescriptions:', req.session.prescriptions);
    res.render('Pharmacy/Prescription', {
      title: 'Prescription Pharmacy',
      prescriptionsData: JSON.stringify(req.session.prescriptions || []), // Use session data or a fallback empty array
    });
});


export default router;