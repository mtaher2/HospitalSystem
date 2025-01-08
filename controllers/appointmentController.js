import * as appointmentModel from "../models/appointmentsmodle.js";
import { getSpecialties } from "../models/doctorModel.js";
import { generateInvoicePdf } from "../Services/invoiceService.js";
import { globalPatientUserID } from "../globalVariables.js";
import { globalPatientNationalId } from "../globalVariables.js";

export async function bookAppointment(req, res) {
  try {
    const user = req.session.user;
    let appointmentData = req.body;
    console.log("Appointment data:", appointmentData);

    if (user.Role === 6) {
      appointmentData.Patient_ID = globalPatientUserID;
      console.log("Using globalPatientUserID for Patient_ID:", globalPatientUserID);
    }

    if (
      !appointmentData.Patient_ID ||
      !appointmentData.Doctor_ID ||
      !appointmentData.Appointment_Date ||
      !appointmentData.Appointment_Time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: Patient_ID, Doctor_ID, Appointment_Date, and Appointment_Time are mandatory.",
      });
    }

    console.log("Booking appointment with billing:", appointmentData);  

    // Create appointment with billing
    const result = await appointmentModel.createAppointmentWithBilling(appointmentData);
    console.log("Appointment booked successfully:", result);
    const specialties = await getSpecialties();
    await generateInvoicePdf(appointmentData.Patient_ID, result.Billing_ID);

    console.log("Appointment booked successfully:", result);
    res.render("patient/addAppointment", {
      alertMessage: "Appointment booked successfully...",
      alertType: "success",
      title: "Add Appointment",
      specialties,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);

    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({
        success: false,
        message: "Invalid field(s) in appointment data.",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to book appointment.",
      error: error.message,
    });
  }
}


export async function getAppointmentsByPatient(req, res) {
  const user = req.session.user;

  if (!user || !user.User_ID) {
    return res.status(400).json({ error: "Patient ID is required" });
  }

  const activeTab = req.activeTab || "upcoming";
  let appointments = [];

  try {
   
    let userIdToUse = user.User_ID;
    if (user.Role === 6) {
      
      if (!globalPatientUserID || !globalPatientNationalId) {
        return res.render("patient/appointments", {
          user: user,
          activeTab: activeTab,
          appointments: [],
          Cancelappointments: [],
          message: "No patient selected. Please select a patient first.",
        });
      }
      
      userIdToUse = globalPatientUserID; 
    }

    
    if (activeTab === "upcoming") {
      appointments = await appointmentModel.getUpcomingAppointments(userIdToUse);
    } else if (activeTab === "missed") {
      appointments = await appointmentModel.getPastAppointments(userIdToUse);
    }

   
    return res.render("patient/appointments", {
      user: user,
      activeTab: activeTab,
      appointments: activeTab === "upcoming" ? appointments : [],
      Cancelappointments: activeTab === "missed" ? appointments : [],
      message:
        appointments.length === 0
          ? `No ${activeTab} appointments found`
          : null,
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message || error,
    });
  }
}

export async function getAppointments(req, res) {
  const tab = req.query.tab || 'upcoming';
const filters = {
  date: req.query.date,
  time: req.query.time,
  doctor: req.query.doctor,
  patient: req.query.patient,
  room: req.query.room,
};

let activeTab = tab;
let appointments = [];
let noDataMessage = '';

try {
  appointments = await appointmentModel.getFilteredAppointments(filters, activeTab);

  if (!appointments || appointments.length === 0) {
    noDataMessage = 'No appointments found with the given filters.';
  }
  res.render('reception/receptionAppointments', {
    activeTab,
    appointments,
    filters,
    noDataMessage,
  });
} catch (error) {
  console.error('Error fetching appointments:', error);

  res.render('reception/receptionAppointments', {
    activeTab,
    appointments: [],
    filters,
    noDataMessage: 'An error occurred while fetching appointments. Please try again later.',
  });
}

}





  
  
  
  
  
  
