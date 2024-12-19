import express from "express";
import {
  renderPatientProfile,
  updatePatientProfile,
} from "../controllers/patientController.js";
import { cancelAppointment } from "../models/appointmentsmodle.js";
import checkAuthenticated from "../middlewares/checkAuthenticated.js";
import { upload } from "../utils/multerConfig.js";
import { uploadProfilePhoto } from "../controllers/patientController.js";
import * as doc from "../controllers/doctorController.js";
import {
  bookAppointment,
  getAppointmentsByPatient,
} from "../controllers/appointmentController.js";

const router = express.Router();

// Protect the patient profile route with checkAuthenticated middleware
router.get(
  "/patient-profile",
  checkAuthenticated([7, 2]),
  renderPatientProfile
);

// Route to handle profile update
router.post(
  "/update-profile",
  checkAuthenticated([7, 2]),
  updatePatientProfile
);

// Route to handle profile photo upload
router.post(
  "/uploadProfilePhoto",
  checkAuthenticated([7, 2]),
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

router.get("/medicalRecords", checkAuthenticated([7, 2]), (req, res) => {
  const activeTab = req.query.tab || "Medical_history"; // Default tab is 'current'
  res.render("patient/medicalRecords", { activeTab });
});

router.get("/medication", checkAuthenticated([7, 2]), (req, res) => {
  const activeTab = req.query.tab || "current"; // Default tab is 'current'
  res.render("patient/medication", { activeTab });
});

router.get("/patient-Bills", checkAuthenticated([7]), (req, res) => {
  const activeTab = req.query.tab || "unpayed"; // Default tab is 'current'
  res.render("patient/patientBills", { activeTab });
});

// Example route with specialties fetching
router.get("/addAppointment", checkAuthenticated([7, 2]), async (req, res) => {
  try {
    await doc.showAppointmentForm(req, res); // Use showAppointmentForm to handle rendering with specialties
  } catch (error) {
    console.error("Error fetching specialties:", error);
    res.status(500).send("Server error");
  }
});

// router.get("/doctorProfile", checkAuthenticated([7, 2]), (req, res) => {
//   res.render("patient/doctorProfile");
// });

router.get("/doctors/department/:departmentId", doc.fetchDoctorsByDepartment);

// Route for fetching unique specialties
router.get("/specialties", doc.fetchSpecialties);

router.get("/availability/days", doc.fetchAvailableDays);
router.get("/availability/times", doc.fetchAvailableTimes);
router.get("/doctors/availability", doc.fetchDoctorsByTime);
router.get("/doctor-:doctorID", doc.viewDoctorProfile);
router.post("/book-appointment", bookAppointment);
router.get(
  "/appointments",
  (req, res, next) => {
    // Set the activeTab variable based on the query parameter, defaulting to 'upcoming'
    const activeTab = req.query.tab || "upcoming";

    // Attach activeTab to the request object for use in the next handler
    req.activeTab = activeTab;

    // Pass control to the next middleware/handler
    next();
  },
  getAppointmentsByPatient
);

router.post("/appointments/:id/cancel", async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const result = await cancelAppointment(appointmentId);

    if (result.affectedRows > 0) {
      res.status(200).json({ success: true, message: "Appointment canceled." });
    } else {
      res.status(400).json({ success: false, message: "Cancellation failed." });
    }
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Example route in Express (backend)
router.post("/availability-days", doc.fetchAvailableDays);
router.get("/doctors-by-time", doc.fetchDoctorsByTime);

export default router;
