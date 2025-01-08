import * as docModel from "../models/doctorModel.js";
import * as userModel from "../models/userModel.js";

export async function fetchDoctorsByDepartment(req, res) {
  const { departmentId } = req.params;

  try {
    if (!departmentId) {
      return res.status(400).json({ error: "Department ID is required" });
    }

    const doctors = await docModel.getAllDoctorsByDepartment(departmentId);
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors by department:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function fetchSpecialties(req, res) {
  try {
    const specialties = await docModel.getSpecialties();
    res.status(200).json(specialties);
  } catch (error) {
    console.error("Error fetching specialties:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function fetchAvailableDays(req, res) {
  const { specialty } = req.query;

  try {
    if (!specialty) {
      return res.status(400).json({ error: "Specialty is required" });
    }

    // Get all the available days for the selected specialty
    const availableDays = await docModel.getAvailableDays(specialty);

    // Fetch booked appointments to compare and filter out unavailable days
    const bookedAppointments = await docModel.getTimeBookedBefore();
    const bookedDates = bookedAppointments.map((appointment) =>
      appointment.Appointment_Date
    );

    // Filter out booked days
    const availableDates = availableDays.filter(
      (day) => !bookedDates.includes(day)
    );

    res.status(200).json(availableDates);
  } catch (error) {
    console.error("Error fetching available days:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}


export async function fetchAvailableTimes(req, res) {
  const { specialty, day } = req.query;

  try {
    if (!specialty || !day) {
      return res.status(400).json({ error: "Specialty and day are required" });
    }

    const availableTimes = await docModel.getAvailableTimes(specialty, day);
    res.status(200).json(availableTimes);
  } catch (error) {
    console.error("Error fetching available times:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function fetchDoctorsByTime(req, res) {
  const { specialty, day, time } = req.query;

  try {
    if (!specialty || !day || !time) {
      return res
        .status(400)
        .json({ error: "Specialty, day, and time are required" });
    }

    const doctors = await docModel.getDoctorsByTime(specialty, day, time);

    if (doctors.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors by time:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}


export async function showAppointmentForm(req, res) {
  try {
    
    const specialties = await docModel.getSpecialties();
    const availableSlots = []; 

    res.render("patient/addAppointment", {
      title: "Add Appointment",
      specialties, 
      availableSlots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data.");
  }
}

export async function viewDoctorProfile(req, res) {
  try {
    const doctorID = req.params.doctorID; 
    const doctorData = await docModel.getDoctorProfile(doctorID);

    if (!doctorData) {
      return res.status(404).send("Doctor not found");
    }

    const dob = userModel.getDOBFromNationalID(doctorData.National_ID);
    doctorData.Age = userModel.calculateAgeFromDOB(dob);

    res.render("patient/doctorProfile", {
      title: "Doctor Profile",
      doctor: doctorData,
    });
  } catch (error) {
    console.error("Error in viewDoctorProfile controller:", error);
    res.status(500).send("Error fetching doc profile");
  }
}

export async function getDoctorAppointmentsController(req, res) {
  try {
    const doctor_ID = req.session.user.User_ID;
    const { patient, date } = req.query;

    const filters = {
      patientName: patient || '',
      appointmentDate: date || '',
    };

    const appointments = await docModel.filterDoctorAppointments(doctor_ID, filters);


    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.json(appointments); 
    }

    res.render('Doctor/appointmentsDoctor', { appointments, patient, date });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.status(500).send("Internal Server Error");
  }
}

