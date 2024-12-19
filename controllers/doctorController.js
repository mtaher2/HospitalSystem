import {
  getAllDoctorsByDepartment,
  getSpecialties,
  getAvailableDays,
  getAvailableTimes,
  getDoctorsByTime,
  getDoctorProfile,
} from "../models/doctorModel.js";

import {
  getDOBFromNationalID,
  calculateAgeFromDOB,
} from "../models/userModel.js";

// Get all doctors by department
export async function fetchDoctorsByDepartment(req, res) {
  const { departmentId } = req.params;

  try {
    if (!departmentId) {
      return res.status(400).json({ error: "Department ID is required" });
    }

    const doctors = await getAllDoctorsByDepartment(departmentId);
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors by department:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get unique specialties
export async function fetchSpecialties(req, res) {
  try {
    const specialties = await getSpecialties();
    res.status(200).json(specialties);
  } catch (error) {
    console.error("Error fetching specialties:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get available days for a given specialty
export async function fetchAvailableDays(req, res) {
  const { specialty } = req.query; // Fetch from query params

  try {
    if (!specialty) {
      return res.status(400).json({ error: "Specialty is required" });
    }

    const availableDays = await getAvailableDays(specialty);
    res.status(200).json(availableDays);
  } catch (error) {
    console.error("Error fetching available days:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get available times for a given specialty and day
export async function fetchAvailableTimes(req, res) {
  const { specialty, day } = req.query;

  try {
    if (!specialty || !day) {
      return res.status(400).json({ error: "Specialty and day are required" });
    }

    const availableTimes = await getAvailableTimes(specialty, day);
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

    const doctors = await getDoctorsByTime(specialty, day, time);

    if (doctors.length === 0) {
      return res.status(200).json([]); // No doctors found
    }

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors by time:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Show appointment form and fetch specialties
export async function showAppointmentForm(req, res) {
  try {
    // Fetch specialties from the database
    const specialties = await getSpecialties();

    // Fetch available days and times for a specialty (this can be dynamic or predefined)
    const availableSlots = []; // Array for dynamic available slots (optional)

    res.render("patient/addAppointment", {
      title: "Add Appointment",
      specialties, // Pass specialties to EJS
      availableSlots, // Pass available slots data (if needed)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data.");
  }
}

export async function viewDoctorProfile(req, res) {
  try {
    const doctorID = req.params.doctorID; // Get doctor ID from URL parameter
    const doctorData = await getDoctorProfile(doctorID);

    if (!doctorData) {
      return res.status(404).send("Doctor not found");
    }

    // Extract date of birth from National ID
    const dob = getDOBFromNationalID(doctorData.National_ID);

    // Calculate age from date of birth
    doctorData.Age = calculateAgeFromDOB(dob);

    // Render doctor profile page and pass doctor data, including age
    res.render("patient/doctorProfile", {
      title: "Doctor Profile",
      doctor: doctorData, // Pass doctor data with age to the EJS template
    });
  } catch (error) {
    console.error("Error in viewDoctorProfile controller:", error);
    res.status(500).send("Error fetching doctor profile");
  }
}

