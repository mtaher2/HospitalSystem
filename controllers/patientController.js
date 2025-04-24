import * as patientModel from "../models/patientModel.js";
import * as userModel from "../models/userModel.js";
import {sendEmail} from "../middlewares/emailService.js";
import { globalPatientUserID, globalPatientNationalId } from "../globalVariables.js";
import { generateRandomPassword } from '../utils/passwordUtils.js';
import { sendPasswordResetEmail } from '../middlewares/emailService.js';
import { db } from "../db.js";

export const addPatient = async (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file); 

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

  const uploadedInsurancePhoto = req.file
    ? `/storage/insurance/${req.file.filename}`
    : null;
  const pass = userModel.generateRandomPassword(12);
  try {
    const user = {
      National_ID: nationalId,
      FName: firstName,
      MidName: middleName,
      LName: lastName,
      Phone: phone,
      Email: email,
      Address: address,
      Gender: gender,
      Password: pass,
      Role: "patient", 
    };

    const insuranceData =
      insuranceOrg && coverage && expireDate
        ? {
            Insurance_Provider: insuranceOrg,
            Coverage_Details: {
              percentage: coverage,
              image: uploadedInsurancePhoto, 
            },
            Expiry_Date: expireDate,
          }
        : null;

    const patientData = {
      user: user,
      insurance: insuranceData,
    };

    const result = await patientModel.addPatient(patientData);

    sendEmail(email, `${firstName} ${lastName}`, pass);
    res.render("reception/add-patient", {
      alertMessage: "Patient added successfully..",
      alertType: "success",
    });

  } catch (err) {
    console.error("Error adding patient:", err.code);
    if (err.code === "ER_DUP_ENTRY") {
      res.render("reception/add-patient", {
        alertMessage: "This National ID already exists.",
        alertType: "error",
      });
    } else {
      res.render("reception/add-patient", {
        alertMessage: "An error occurred while adding the patient.",
        alertType: "error",
      });
    }
  }
};

export async function renderPatientProfile(req, res) {
  const sessionUser = req.session.user;

  if (!sessionUser) {
    return res.redirect("/");
  }

  try {
    let userId, userData;

    if (sessionUser.Role === 6) {
      if (!globalPatientUserID || !globalPatientNationalId) {
        return res.render("patient/PatientProfile", {
          user: sessionUser, // Show receptionist's session info
          age: null,
          insurance: null,
          stylesheetName: "styles",
          headerTitle: "Patient Profile",
          errorMessage: "No patient selected. Please search for a patient first.",
        });
      }

      userId = globalPatientUserID;
      const patientData = await userModel.selectUserByNationalID(globalPatientNationalId); // Fetch patient data by ID

      userData = { 
        ...patientData[0], 
        Role: sessionUser.Role, 
        User_ID: sessionUser.User_ID, 
      };
    } else {
      userId = sessionUser.User_ID;
      userData = sessionUser; 
    }

    let insurance = await patientModel.selectInsuranceDetails(userId);
    if (!insurance || insurance.length === 0) {
      insurance = null; 
    }
    const dob = userModel.getDOBFromNationalID(userData.National_ID);
    const age = userModel.calculateAgeFromDOB(dob);

    res.render("patient/PatientProfile", {
      user: userData,
      insurance: insurance,
      age: age,
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

export async function updatePatientProfile(req, res) {
  const user = req.session.user; 

  if (!user) {
    return res.redirect("/");
  }

  const { FName, LName, Email, Phone, Address, Gender } = req.body;

  try {
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

   
    req.session.user = { ...user, FName, LName, Email, Phone, Address, Gender };
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

export async function uploadProfilePhoto(req, res) {
  if (!req.file) {
    return res.json({ success: false, message: "No file uploaded" });
  }

  const newImagePath = `/storage/${req.file.filename}`; 

  try {
    const updateResult = await userModel.updateProfilePhoto(
      req.session.user.User_ID,
      newImagePath
    );

    if (updateResult.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Failed to update profile photo in the database",
      });
    }

    req.session.user.profilePhoto = newImagePath;

    res.json({ success: true, newImagePath: newImagePath });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    res.json({ success: false, message: "Database update failed" });
  }
}

/**
 * Reset a patient's password and send the new password via email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetPatientPassword = async (req, res) => {
  try {
    // Check if user is authenticated and has role 6 (patient)
    if (!req.session.user || req.session.user.Role !== 6) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access. Only patients can reset their own password.' 
      });
    }

    // Check if global patient variables are set
    if (!globalPatientUserID || !globalPatientNationalId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No patient selected. Please select a patient first.' 
      });
    }

    // Get patient data using the global variables
    const patientData = await userModel.selectUserByNationalID(globalPatientNationalId);
    
    if (!patientData || patientData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found.' 
      });
    }

    const patient = patientData[0];
    const userId = globalPatientUserID;
    const userEmail = patient.Email;
    const userName = `${patient.FName} ${patient.LName}`;

    // Generate a new random password
    const newPassword = generateRandomPassword();
    
    // Update the password in the database without encryption and set need_update to True
    const updateQuery = 'UPDATE User SET Password = ?, need_update = TRUE WHERE User_ID = ?';
    await db.query(updateQuery, [newPassword, userId]);
    
    // Send the new password via email
    const emailSent = await sendPasswordResetEmail(userEmail, userName, newPassword);
    
    if (emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Password reset successful. A new password has been sent to your email.' 
      });
    } else {
      // If email failed, revert the password change
      const revertQuery = 'UPDATE User SET Password = ?, need_update = FALSE WHERE User_ID = ?';
      await db.query(revertQuery, [patient.Password, userId]);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email with new password. Password reset aborted.' 
      });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while resetting your password. Please try again later.' 
    });
  }
};
