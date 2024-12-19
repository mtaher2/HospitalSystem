import { createAppointmentWithBilling, getUpcomingAppointments  } from "../models/appointmentsmodle.js";
import { getSpecialties } from "../models/doctorModel.js";

export async function bookAppointment(req, res) {
  try {
    const appointmentData = req.body;
    console.log("Appointment data:", appointmentData);
    // Validate the input data
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

    // Call the model function to schedule the appointment
    const result = await createAppointmentWithBilling(appointmentData);
    const specialties = await getSpecialties();
    console.log("Appointment booked successfully:", result);
    // Return success response
    res.render("patient/addAppointment", {
      alertMessage: "Appointment booked successfully...",
      alertType: "success",
      title: "Add Appointment",
      specialties, // Pass specialties to EJS
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error booking appointment:", error);

    // Handle database-specific errors (optional: based on your database driver)
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({
        success: false,
        message: "Invalid field(s) in appointment data.",
        error: error.message,
      });
    }

    // Return generic server error response
    res.status(500).json({
      success: false,
      message: "Failed to book appointment.",
      error: error.message,
    });
  }
}

export async function getAppointmentsByPatient(req, res) {
    const user = req.session.user;
  
    // Check if user and user.User_ID exist
    if (!user || !user.User_ID) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
  
    try {
      // Fetch upcoming appointments by patient ID
      const appointments = await getUpcomingAppointments(user.User_ID);
      console.log('Data passed to render:', { appointments });
      // Debugging to confirm data structure
      console.log('Appointments:', appointments);
      console.log('User:', user);
  
      // Render the appointments page with data or an empty list
      return res.render('patient/appointments', {
        user: user,
        activeTab: req.activeTab || "upcoming",
        appointments: appointments || [], // Always pass an array (even empty)
        message: appointments.length === 0 ? 'No upcoming appointments found' : null,
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message || error, // Include error details for debugging
      });
    }
  }
  
  
  
