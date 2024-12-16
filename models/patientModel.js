import { db } from "../db.js";
import { addUser, getRoleId } from './userModel.js';


async function insertPatient(userId) {
    const insertPatientQuery = `INSERT INTO Patient (Patient_ID, Health_Statistics, Health_History) 
                                VALUES (?, NULL, NULL)`;  // Health_Statistics and Health_History are NULL by default
    try {
        const [patientResult] = await db.query(insertPatientQuery, [userId]);
        return patientResult.insertId;  // Return the inserted Patient_ID
    } catch (err) {
        console.error('Error adding patient:', err);
        throw err;
    }
}

async function insertInsurance(insurance) {
    const { Insurance_Provider, Coverage_Details, Expiry_Date } = insurance;
    const coverageJson = JSON.stringify(Coverage_Details);  // Convert Coverage_Details to JSON format

    const insertInsuranceQuery = `INSERT INTO Insurance (Insurance_Provider, Coverage_Details, Expiry_Date) VALUES (?, ?, ?)`;

    try {
        const [insuranceResult] = await db.query(insertInsuranceQuery, [
            Insurance_Provider,
            coverageJson,
            Expiry_Date
        ]);

        return insuranceResult.insertId;  // Return the inserted Insurance_ID
    } catch (err) {
        console.error('Error adding insurance:', err);
        throw err;
    }
}

async function updatePatientWithInsurance(patientId, insuranceId) {
    console.log('Updating patient with insurance:', { patientId, insuranceId }); // Log the IDs
    const updatePatientInsuranceQuery = `UPDATE Patient SET Insurance_ID = ? WHERE Patient_ID = ?`;

    try {
        const [result] = await db.query(updatePatientInsuranceQuery, [insuranceId, patientId]);
        console.log('Update result:', result); // Log the update query result
    } catch (err) {
        console.error('Error updating patient with insurance:', err);
        throw err;
    }
}


// Main function to add a user and patient
async function addPatient(patientData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
  
      const roleId = await getRoleId(patientData.user.Role);
      const userId = await addUser(patientData.user, roleId);
      const patientId = await insertPatient(userId);
  
      if (patientData.insurance) {
        console.log('Adding insurance for patient:', patientId);
        const insuranceId = await insertInsurance(patientData.insurance);
        await updatePatientWithInsurance(userId, insuranceId);
      }
  
      await connection.commit();
      return { patientId, userId };
    } catch (err) {
      await connection.rollback();
      console.error('Error adding patient:', err);
      throw err;
    } finally {
      connection.release();
    }
  }
  


export const selectPatientByID = async (patientID) => {
  const query = "SELECT * FROM Patients WHERE Patient_ID = ?"; // Adjust table and column names
  try {
    const [results] = await db.query(query, [patientID]);
    return results[0]; // Return the first matching record
  } catch (err) {
    console.error("Error fetching patient:", err);
    throw err;
  }
};

async function selectInsuranceDetails(userID) {
  const query = `
    SELECT 
      Insurance.Insurance_Provider, 
      Insurance.Coverage_Details, 
      Insurance.Expiry_Date
    FROM User 
    INNER JOIN Patient ON Patient_ID = User.User_ID
    INNER JOIN Insurance ON Patient.Insurance_ID = Insurance.Insurance_ID
    WHERE Patient.Patient_ID = ?
  `;

  try {
    const [results] = await db.query(query, [userID]);

    // If no results are found, log and return null
    if (results.length === 0) {
      console.log("Insurance details not found for the user.");
      return null;
    }

    // Assuming only one insurance record per user
    const insuranceDetails = results[0];

    // Parse and handle coverage details
    insuranceDetails.Insurance_Coverage = parseCoverage(
      insuranceDetails.Coverage_Details
    );

    if (insuranceDetails.Expiry_Date) {
      insuranceDetails.Expiry_Date = formatDate(insuranceDetails.Expiry_Date);
    }
    return insuranceDetails; // Return the insurance details with extracted coverage percentage
  } catch (err) {
    console.error("Error selecting insurance details:", err);
    throw err; // Rethrow the error for the caller to handle
  }
}

function parseCoverage(coverageData) {
  if (!coverageData) {
    return "N/A"; // If no coverage data exists, return 'N/A'
  }

  try {
    // Parse the Coverage_Details JSON and extract the coverage percentage
    const coverage = JSON.parse(coverageData);

    // Check if the 'percentage' field exists in the parsed data
    if (coverage && coverage.percentage) {
      return coverage.percentage; // Return the coverage percentage
    } else {
      console.log("Coverage percentage not found in the data.");
      return "N/A"; // Return 'N/A' if the percentage is missing
    }
  } catch (parseError) {
    console.error("Error parsing Coverage_Details JSON:", parseError);
    return "Invalid JSON"; // Return 'Invalid JSON' in case of an error during parsing
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  // Format the date to YYYY-MM-DD
  const formattedDate = date.toISOString().split("T")[0];
  return formattedDate;
}

function handleCoverageError() {
  console.error("There was an issue with the coverage data.");
  return "Invalid JSON"; // Return a default error message
}

//verify Patient Insurance
async function verifyPatientInsurance(insuranceData) {
    const { Insurance_ID, Insurance_Provider, Policy_Number, Coverage_Details, Expiry_Date } = insuranceData;

    const sql = `INSERT INTO Insurance (Insurance_ID, Insurance_provider, Policy_Number, Coverage_Details, Expiry_Date) VALUES (?, ?, ?, ?)`;

    const values = [Insurance_ID, Insurance_Provider, Policy_Number, Coverage_Details, Expiry_Date];

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query(sql, values);
        await connection.commit();
        return { message: 'Insurance added successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export {selectInsuranceDetails, addPatient, verifyPatientInsurance };