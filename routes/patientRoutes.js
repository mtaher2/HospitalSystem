import express from "express";
import {
  renderPatientProfile,
  updatePatientProfile,
} from "../controllers/patientController.js";
import checkAuthenticated from "../middlewares/checkAuthenticated.js"; // Import the middleware
import { upload } from "../utils/multerConfig.js"; // Correct import
import { uploadProfilePhoto } from "../controllers/patientController.js"; // Import the function to handle the upload

const router = express.Router();

// Protect the patient profile route with checkAuthenticated middleware
router.get(
  "/patient-profile",
  checkAuthenticated([1, 2]),
  renderPatientProfile
);

// Route to handle profile update
router.post(
  "/update-profile",
  checkAuthenticated([1, 2]),
  updatePatientProfile
);

// Route to handle profile photo upload
router.post(
  "/uploadProfilePhoto",
  checkAuthenticated([1, 2]),
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

router.get("/medicalRecords", checkAuthenticated([1, 2]), (req, res) => {
  const activeTab = req.query.tab || "Medical_history"; // Default tab is 'current'
  res.render("patient/medicalRecords", { activeTab });
});

router.get("/medication", checkAuthenticated([1, 2]), (req, res) => {
  const activeTab = req.query.tab || "current"; // Default tab is 'current'
  res.render("patient/medication", { activeTab });
});

router.get("/patient-Bills", checkAuthenticated([1]), (req, res) => {
  const activeTab = req.query.tab || "unpayed"; // Default tab is 'current'
  res.render("patient/patientBills", { activeTab });
});

router.get("/appointments-patient", checkAuthenticated([1, 2]), (req, res) => {
  const activeTab = req.query.tab || "upcoming"; // Default tab is 'current'
  res.render("patient/appointments", { activeTab });
});

router.get("/addAppointment",checkAuthenticated([1, 2]), (req, res) => {
  res.render("patient/addAppointment");
});

router.get("/doctorProfile",checkAuthenticated([1, 2]), (req, res) => {
  res.render("patient/doctorProfile");
});
export default router;
