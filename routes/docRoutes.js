import express from "express";
import checkAuthenticated from "../middlewares/checkAuthenticated.js";
import { getDoctorAppointmentsController } from "../controllers/doctorController.js";
import { globalPatientUserID } from "../globalVariables.js";
import {
  getLabSuggestions,
  getRadiologySuggestions,
} from "../models/doctorModel.js";
import * as labOrderModel from "../models/doctorModel.js";
import * as billing from "../models/billingModle.js";
import { createAnnouncement, fetchAnnouncements } from '../controllers/announcementController.js';
import { insertPrescription,getMedicationSuggestions, validateMedication, addPrescription, } from "../models/doctorModel.js";
import { db } from "../db.js";
const router = express.Router();
router.use(express.json());

router.get(
  "/doctor-appointment",
  checkAuthenticated([2]),
  getDoctorAppointmentsController
);

router.get("/doctor-prescription",checkAuthenticated([2]), async (req, res) => {
  const patientId = globalPatientUserID; // Assuming patientId is set globally or passed here
  const doctorId = req.session.user?.User_ID;

  try {
    // Fetch Patient Name
    const [patient] = await db.query(
      "SELECT FName, LName FROM `User` WHERE `User_ID` = ?",
      [patientId]
    );
    const patientName = patient
      ? `${patient[0].FName} ${patient[0].LName}`
      : "Unknown";

    // Fetch Lab Orders
    const [labOrders] = await db.query(
      `SELECT lo.Lab_Order_ID, lo.Status, lo.Results, lo.Created_At AS Date,
                l.Lab_Name AS LabCode, l.Description AS Type
         FROM Lab_Order lo
         JOIN Lab l ON lo.Lab_ID = l.Lab_ID
         WHERE lo.Patient_ID = ? AND lo.Doctor_ID = ?`,
      [patientId, doctorId]
    );

    // Fetch Radiology Orders
    const [radiologyOrders] = await db.query(
      `SELECT ro.Radiology_Order_ID, ro.Status, ro.Results, ro.Created_At AS Date,
                r.Scan_Name AS LabCode, r.Description AS Type
         FROM Radiology_Order ro
         JOIN Radiology r ON ro.Radiology_ID = r.Radiology_ID
         WHERE ro.Patient_ID = ? AND ro.Doctor_ID = ?`,
      [patientId, doctorId]
    );

    // Render the view with both labOrders and radiologyOrders
    res.render("Doctor/prescriptions", {
      user: req.session.user || null,
      patientName,
      labOrders,
      radiologyOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server error");
  }
});

router.get("/filter-lab-and-radiology", async (req, res) => {
  const { type, query } = req.query;

  try {
    let results;
    if (type === "lab") {
      results = await getLabSuggestions(query);
    } else if (type === "radiology") {
      results = await getRadiologySuggestions(query);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/order-lab", async (req, res) => {
    const { labName } = req.body;
    const patientId = globalPatientUserID;
    const doctorId = req.session.user.User_ID;
  
    try {
      const labData = await labOrderModel.getLabData(labName);
  
      if (!labData.length) {
        return res.status(404).json({ message: "Lab not found" });
      }
  
      const { Lab_ID, Cost } = labData[0];
      const insuranceId = await labOrderModel.getPatientInsurance(patientId);
  
      const invoiceResult = await billing.createInvoice(patientId, Cost, insuranceId);
  
      if (invoiceResult.message !== "Invoice created successfully") {
        return res.status(500).json({ message: "Error creating invoice" });
      }
  
      const billingId = invoiceResult.billingId;
  
      const labOrderId = await labOrderModel.createLabOrder(patientId, doctorId, Lab_ID, billingId);
  
      res.status(200).end(); // Just send a status with no body
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error placing lab order" });
    }
  });
  
  router.post("/order-radiology", async (req, res) => {
    const { scanName } = req.body;
    const patientId = globalPatientUserID;
    const doctorId = req.session.user.User_ID;
  
    try {
      const radiologyData = await radiologyOrderModel.getRadiologyData(scanName);
  
      if (!radiologyData.length) {
        return res.status(404).json({ message: "Radiology scan not found" });
      }
  
      const { Radiology_ID, Cost } = radiologyData[0];
      const insuranceId = await radiologyOrderModel.getPatientInsurance(patientId);
  
      const invoiceResult = await billing.createInvoice(patientId, Cost, insuranceId);
  
      if (invoiceResult.message !== "Invoice created successfully") {
        return res.status(500).json({ message: "Error creating invoice" });
      }
  
      const billingId = invoiceResult.billingId;
  
      const radiologyOrderId = await radiologyOrderModel.createRadiologyOrder(patientId, doctorId, Radiology_ID, billingId);
  
      res.status(200).end(); // Just send a status with no body
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error placing radiology order" });
    }
  });
  

  router.get("/fetch-orders", async (req, res) => {
    const patientId  = globalPatientUserID;
    const doctorId = req.session.user?.User_ID;
  
    try {
      // Fetch Patient Name
      const [patient] = await db.query(
        "SELECT FName, LName FROM `User` WHERE `User_ID` = ?",
        [patientId]
      );
      const patientName = patient ? `${patient[0].FName} ${patient[0].LName}` : "Unknown";
  
      // Fetch Lab Orders
      const [labOrders] = await db.query(
        `SELECT lo.Lab_Order_ID, lo.Status, lo.Results, lo.Created_At AS Date,
                  l.Lab_Name AS LabCode, l.Description AS Type
         FROM Lab_Order lo
         JOIN Lab l ON lo.Lab_ID = l.Lab_ID
         WHERE lo.Patient_ID = ? AND lo.Doctor_ID = ?`,
        [patientId, doctorId]
      );
  
      // Fetch Radiology Orders
      const [radiologyOrders] = await db.query(
        `SELECT ro.Radiology_Order_ID, ro.Status, ro.Results, ro.Created_At AS Date,
                  r.Scan_Name AS LabCode, r.Description AS Type
         FROM Radiology_Order ro
         JOIN Radiology r ON ro.Radiology_ID = r.Radiology_ID
         WHERE ro.Patient_ID = ? AND ro.Doctor_ID = ?`,
        [patientId, doctorId]
      );
  
      res.json({ labOrders, radiologyOrders, patientName });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching orders" });
    }
  });

router.get("/create-announcement",checkAuthenticated([2,4]), (req, res) => {
  res.render("Doctor/Home");
});

router.post('/create-announcement',checkAuthenticated([2,4]), createAnnouncement);

router.get('/notifications',checkAuthenticated([2]), fetchAnnouncements);

router.get("/medication-suggestions", async (req, res) => {
  const { query } = req.query;
  try {
    const suggestions = await getMedicationSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Route for adding prescriptions
router.post("/prescriptions", async (req, res) => {
  const { prescriptions } = req.body;

  try {
    for (const prescription of prescriptions) {
      // Validate medication
      await validateMedication(prescription.name);

      // Add prescription
      await addPrescription({
        patientId: globalPatientUserID,
        doctorId: req.session.user.User_ID,
        name: prescription.name,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        startDate: prescription.startDate,
        endDate: prescription.endDate,
        refillTimes: prescription.refillTimes,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});


export default router;
