import { selectUserByNationalID } from "../models/userModel.js";
import {
  getDOBFromNationalID,
  calculateAgeFromDOB,
  updateProfilePhoto,
} from "../models/userModel.js";
import { selectInsuranceDetails } from "../models/patientModel.js";
import * as patientModel from "../models/patientModel.js";
import * as userModel from "../models/userModel.js";
import sendEmail from "../middlewares/emailService.js";

const addPatient = async (req, res) => {
  console.log("Request Body:", req.body); // This will log the form data
  console.log("Uploaded File:", req.file); // This will log the uploaded file, if any

  const {
    nationalId,
    firstName,
    middleName,
    lastName,
    phone,
    email,
    address,
    gender,
    insuranceOrg,
    coverage,
    expireDate,
  } = req.body;

  // Check if the insurance photo was uploaded, if not set it to null
  const uploadedInsurancePhoto = req.file
    ? `/storage/insurance/${req.file.filename}`
    : null;
  const pass = userModel.generateRandomPassword(12);
  try {
    // Prepare user data for addUser
    const user = {
      National_ID: nationalId,
      FName: firstName,
      MidName: middleName,
      LName: lastName,
      Phone: phone,
      Email: email,
      Address: address,
      Gender: gender,
      Password: pass, // You can generate or pass a default password here
      Role: "patient", // Set the role for the user as 'patient'
    };

    // Prepare insurance data (if provided)
    const insuranceData =
      insuranceOrg && coverage && expireDate
        ? {
            Insurance_Provider: insuranceOrg,
            Coverage_Details: {
              percentage: coverage,
              image: uploadedInsurancePhoto, // If no image is uploaded, it will be null
            },
            Expiry_Date: expireDate,
          }
        : null;

    // Prepare the patient data object
    const patientData = {
      user: user,
      insurance: insuranceData,
    };

    // Call addPatient from patientModel to insert the data into the database
    const result = await patientModel.addPatient(patientData);

    sendEmail(email, `${firstName} ${lastName}`, pass);
    // Test alert message for success
    res.render("reception/add-patient", {
      alertMessage: "Patient added successfully..",
      alertType: "success",
    });

  } catch (err) {
    console.error("Error adding patient:", err.code);
    if (err.code === "ER_DUP_ENTRY") {
      // If the error is a duplicate entry error, show an error message
      res.render("reception/add-patient", {
        alertMessage: "This National ID already exists.",
        alertType: "error",
      });
    } else {
      // Handle any other errors
      res.render("reception/add-patient", {
        alertMessage: "An error occurred while adding the patient.",
        alertType: "error",
      });
    }
  }
};

// Render the patient profile page
async function renderPatientProfile(req, res) {
  const user = req.session.user; // Get the logged-in user data from session

  if (!user) {
    // If no user is found in the session, redirect to login page
    return res.redirect("/");
  }

  try {
    // Fetch the user details from the database
    const userData = await selectUserByNationalID(user.National_ID);
    const userId = user.User_ID;
    const insurance = await selectInsuranceDetails(userId);
    console.log(insurance);
    if (userData.length === 0) {
      return res.render("404", { errorMessage: "User not found" });
    }

    // Get the Date of Birth from the National ID and calculate the age
    const dob = getDOBFromNationalID(user.National_ID); // Get DOB from the National ID
    const age = calculateAgeFromDOB(dob); // Calculate the age
    // Render the patient profile page and pass the user data and calculated age
    res.render("patient/PatientProfile", {
      user: user,
      insurance: insurance,
      age: age, // Pass the calculated age to the template
      stylesheetName: "styles",
      headerTitle: "Patient Profile",
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.render("login", {
      errorMessage: "An error occurred. Please try again later.",
      stylesheetName: "styles",
      headerTitle: "Galala Hospital System",
    });
  }
}

// Optionally, you can add any other routes related to the patient's profile here
// For example, for updating user details

async function updatePatientProfile(req, res) {
  const user = req.session.user; // Get the logged-in user from session

  if (!user) {
    // If no user is found, redirect to login
    return res.redirect("/");
  }

  const { FName, LName, Email, Phone, Address, Gender } = req.body;

  try {
    // Update user information in the database
    // Assuming you have an `updateUser` method in your model to handle this
    const updateResult = await updateUser(
      user.National_ID,
      FName,
      LName,
      Email,
      Phone,
      Address,
      Gender
    );

    if (updateResult.affectedRows === 0) {
      return res.render("patient-profile", {
        user: user,
        errorMessage: "Failed to update profile, please try again.",
        stylesheetName: "styles",
        headerTitle: "Patient Profile",
      });
    }

    // If update is successful, reload the profile page with updated data
    req.session.user = { ...user, FName, LName, Email, Phone, Address, Gender }; // Update session data
    res.render("PatientProfile", {
      user: req.session.user,
      stylesheetName: "styles",
      headerTitle: "Patient Profile",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.render("patient-profile", {
      user: user,
      errorMessage: "An error occurred while updating your profile.",
      stylesheetName: "styles",
      headerTitle: "Patient Profile",
    });
  }
}

async function uploadProfilePhoto(req, res) {
  if (!req.file) {
    return res.json({ success: false, message: "No file uploaded" });
  }

  const newImagePath = `/storage/${req.file.filename}`; // Store the file path

  try {
    // Update the profile photo in the database
    const updateResult = await updateProfilePhoto(
      req.session.user.User_ID,
      newImagePath
    );

    if (updateResult.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Failed to update profile photo in the database",
      });
    }

    // Update the profile photo in the session
    req.session.user.profilePhoto = newImagePath;

    // Return the new image path to the client
    res.json({ success: true, newImagePath: newImagePath });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    res.json({ success: false, message: "Database update failed" });
  }
}

export {
  addPatient,
  renderPatientProfile,
  updatePatientProfile,
  uploadProfilePhoto,
};
