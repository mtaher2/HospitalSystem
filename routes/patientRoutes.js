import express from "express";
import {
  renderPatientProfile,
  updatePatientProfile,
  resetPatientPassword
} from "../controllers/patientController.js";
import { cancelAppointment, getPastAppointments, rescheduleAppointment } from "../models/appointmentsmodle.js";
import checkAuthenticated from "../middlewares/checkAuthenticated.js";
import { upload } from "../utils/multerConfig.js";
import { uploadProfilePhoto } from "../controllers/patientController.js";
import * as doc from "../controllers/doctorController.js";
import { getPatientPastMedications , getPatientCurrentMedications, getPatientHealthStatistics, getMedicalRecordHistory} from "../models/patientModel.js";
import {
  bookAppointment,
  getAppointmentsByPatient,
  
} from "../controllers/appointmentController.js";
import { showPatientBills } from "../controllers/billingController.js";
import { globalDoctorUserID, globalPatientUserID, setGlobalPatientUserID } from "../globalVariables.js";

const router = express.Router();
router.use(express.json());

router.get(
  "/patient-profile",
  checkAuthenticated([7, 6]),
  renderPatientProfile
);

router.post(
  "/update-profile",
  checkAuthenticated([7, 6]),
  updatePatientProfile
);

router.post(
  "/uploadProfilePhoto",
  checkAuthenticated([7, 6]),
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

router.get("/medicalRecords", checkAuthenticated([7, 6, 2 , 4]), async (req, res) => {
  const activeTab = req.query.tab || "Medical_history";
  const sessionUser = req.session.user;
  let patientId;

  if (sessionUser?.Role === 6) {
    // Role 6: Use globalPatientUserID if available
    if (!globalPatientUserID) {
      return res.render("patient/medicalRecords", {
        activeTab,
        medicalHistory: [],
        errorMessage: "No patient selected. Please select a patient first.",
      });
    }
    patientId = globalPatientUserID;
  } else if (sessionUser?.Role === 2 || sessionUser?.Role === 4) {
    if (!globalPatientUserID) {
      return res.render("patient/medicalRecords", {
        activeTab,
        medicalHistory: [],
        errorMessage: "No patient selected. Please provide a valid patient ID.",
      });
    }
    patientId = globalPatientUserID;
  } else {
    patientId = sessionUser.User_ID;
  }

  let medicalHistory = [];
  if (activeTab === "Medical_history") {
    try {
      medicalHistory = await getMedicalRecordHistory(patientId);
    } catch (error) {
      console.error("Error retrieving medical history:", error);
    }
  }

  res.render("patient/medicalRecords", { activeTab, medicalHistory });
});


router.post("/setGlobalPatientID", (req, res) => {
  try {
    const { patientID } = req.body;
    console.log("patientID from global", req.body);
    if (!patientID) {
      return res.status(400).json({ error: "Patient ID is required." });
    }

    setGlobalPatientUserID(patientID);
    res.status(200).json({ message: "Global patient ID set successfully." });
  } catch (error) {
    console.error("Error setting global patient ID:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/healthStatistics",checkAuthenticated([2,7, 6, 4]) ,async (req, res) => {
  try {
    let patientId;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(400).render("error", {
        title: "Error",
        message: "You are not logged in. Please log in again.",
        stylesheetName: "styles",
      });
    }

    if (sessionUser.Role === 6) {
      if (!globalPatientUserID) {
        return res.status(400).render("error", {
          title: "Error",
          message: "Please search for a patient first.",
          stylesheetName: "styles",
        });
      }
      patientId = globalPatientUserID;
    } else if (sessionUser.Role === 2 || sessionUser.Role === 4) {
      patientId = globalPatientUserID;
      console.log("patientId", patientId);
    } else {
      patientId = sessionUser.User_ID;
    }

    const healthData = await getPatientHealthStatistics(patientId);

    if (!healthData) {
      return res.render("patient/healthStatistics", {
        title: "Patient Health Statistics",
        healthData: null,
        stylesheetName: "styles",
        headerTitle: "Health Statistics",
      });
    }

    res.render("patient/healthStatistics", {
      title: "Patient Health Statistics",
      healthData,
      stylesheetName: "styles",
      headerTitle: "Health Statistics",
    });
  } catch (error) {
    console.error("Error fetching health statistics:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "An error occurred while fetching health statistics. Please try again later.",
      stylesheetName: "styles",
    });
  }
});

router.get("/load-more-data", async (req, res) => {
  try {
    const { type } = req.query;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(400).json({ message: "You are not logged in. Please log in again." });
    }

    let patientId;

    if (sessionUser.Role === 6) {
      if (!globalPatientUserID) {
        return res.status(400).json({ message: "Please search for a patient first." });
      }
      patientId = globalPatientUserID;
    } else if (sessionUser.Role === 2) {
      patientId = globalPatientUserID;
    } else {
      patientId = sessionUser.User_ID;
    }

    const healthData = await getPatientHealthStatistics(patientId);
    let newData = [];

    if (type === "vaccinationHistory") {
      newData = healthData.vaccinationHistory.slice(6);
    } else if (type === "chronicDiseases") {
      console.log("loadMore", healthData.chronicDiseases);
      newData = Object.keys(healthData.chronicDiseases).slice(6);
    } else if (type === "allergies") {
      newData = healthData.allergies.slice(6);
    }

    res.json(newData.length > 0 ? newData : []);
  } catch (error) {
    console.error("Error loading more data:", error);
    res.status(500).json({ message: "Error loading more data", error: error.message });
  }
});


router.get('/patient-Bills', checkAuthenticated([7, 6]), async (req, res, next) => {
  try {
    const { tab } = req.query; 
    if (!tab || !["unpayed", "payed"].includes(tab)) {
      req.tab = "unpayed";
    } else {
      req.tab = tab; 
    }

    next();
  } catch (error) {
    console.error("Error in route middleware:", error);
    res.status(500).send("Internal server error");
  }
}, showPatientBills);

router.get("/addAppointment", checkAuthenticated([7, 6]), async (req, res) => {
  try {
    await doc.showAppointmentForm(req, res);
  } catch (error) {
    console.error("Error fetching specialties:", error);
    res.status(500).send("Server error");
  }
});

router.get("/doctors/department/:departmentId", doc.fetchDoctorsByDepartment);
router.get("/specialties", doc.fetchSpecialties);
router.get("/availability/days", doc.fetchAvailableDays);
router.get("/availability/times", doc.fetchAvailableTimes);
router.get("/doctors/availability", doc.fetchDoctorsByTime);
router.get("/doctor-profile-:doctorID", doc.viewDoctorProfile);
router.post("/book-appointment", bookAppointment);
router.get('/appointments', async (req, res, next) => {
  if(!req.session.user) {
    return res.redirect('/');
  }
  try {
    const { activeTab } = req.query; 
    if (!activeTab || !["upcoming", "missed"].includes(activeTab)) {
      req.activeTab = "upcoming";
    } else {
      req.activeTab = activeTab;
    }
    next();
  } catch (error) {
    console.error("Error in route middleware:", error);
    res.status(500).send("Internal server error");
  }
}, getAppointmentsByPatient);
router.post('/appointments/:id/cancel', async (req, res) => {
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

router.post('/appointments/:id/reschedule', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { New_Appointment_Date, New_Appointment_Time } = req.body;
    
    if (!New_Appointment_Date || !New_Appointment_Time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }
    
    // Convert time to database format if needed
    const appointmentData = {
      Appointment_ID: appointmentId,
      New_Appointment_Date,
      New_Appointment_Time
    };
    
    const result = await rescheduleAppointment(appointmentData);
    
    if (result) {
      return res.status(200).json({ message: 'Appointment rescheduled successfully' });
    } else {
      return res.status(400).json({ error: 'Failed to reschedule appointment' });
    }
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get(
  '/medication',
  checkAuthenticated([2, 7, 6,4]),
  async (req, res, next) => {
    try {
      const { tab } = req.query;
      req.activeTab = !tab || !["current", "took_before"].includes(tab) ? "current" : tab;
      next();
    } catch (error) {
      console.error("Error in route middleware:", error);
      res.status(500).send("Internal server error");
    }
  },
  async (req, res) => {
    try {
      const activeTab = req.activeTab;
      const user = req.session.user;
      let patientId;
      console.log("user", user);
      if (user?.Role === 6) {
        // Logic for Role 6
        if (!globalPatientUserID) {
          return res.render('patient/medication', {
            activeTab: activeTab,
            currentMedications: [],
            pastMedications: [],
            errorMessage: 'No patient selected. Please select a patient first.',
          });
        }
        patientId = globalPatientUserID; // Use globalPatientUserID if available for Role 6
      } else if (user?.Role === 2 || user?.Role === 4) {
        // Logic for Role 2
        patientId = globalPatientUserID; 
        console.log("patientId", patientId);
        if (!patientId) {
          return res.render('patient/medication', {
            activeTab: activeTab,
            currentMedications: [],
            pastMedications: [],
            errorMessage: 'No patient selected. Please provide a valid patient ID.',
          });
        }
      } else {
        patientId = user?.User_ID; // Default for other roles (e.g., Role 7)
      }

      if (!patientId) {
        return res.render('patient/medication', {
          activeTab: activeTab,
          currentMedications: [],
          pastMedications: [],
          errorMessage: 'User not authenticated.',
        });
      }

      const currentMedications = await getPatientCurrentMedications(patientId);
      const pastMedications = await getPatientPastMedications(patientId);
      console.log("currentMedications", currentMedications);
      console.log("pastMedications", pastMedications);
      res.render('patient/medication', {
        activeTab: activeTab,
        currentMedications: currentMedications || [],
        pastMedications: pastMedications || [],
        errorMessage: '',
      });
    } catch (error) {
      console.error("Error in medication route:", error);
      res.render('patient/medication', {
        activeTab: req.activeTab || "current",
        currentMedications: [],
        pastMedications: [],
        errorMessage: 'Failed to load medication data.',
      });
    }
  }
);

router.post("/availability-days", doc.fetchAvailableDays);
router.get("/doctors-by-time", doc.fetchDoctorsByTime);

// Password reset route
router.post("/reset-password", checkAuthenticated([6]), resetPatientPassword);

export default router;
