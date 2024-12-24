import { db } from "../db.js";
import { addUser, getRoleId } from "./userModel.js";


export async function getPatientMedicalRecords(patientId) {
  const sql = `
      SELECT 
          m.Record_ID, m.Description, m.Date_Of_Entry, m.Notes
      FROM 
          Medical_Record m
      WHERE 
          m.Patient_ID = ?;
  `;

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(sql, [patientId]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPatientCurrentMedications(patientId) {
  const sql = `
      SELECT 
          p.Prescription_ID, p.Patient_ID, p.Doctor_ID, p.Billing_ID, p.Date_Prescribed,
          p.Medication_Name, p.Dosage, p.Frequency, p.Start_Date, p.End_Date, 
          p.Status, p.Refill_Times, p.Upcoming_Refill
      FROM 
          Prescription p
      WHERE 
          p.Patient_ID = ? 
          AND p.End_Date > CURDATE();
    `;

  try {
    console.log("Executing query to fetch medications for patient:", patientId);
    const [rows] = await db.query(sql, [patientId]); 
    console.log("Medications fetched:", rows);
    return rows;
  } catch (error) {
    console.error("Error fetching medications:", error);
    throw error;
  }
}

export async function getPatientPastMedications(patientId) {
  const sql = `
      SELECT 
          p.Prescription_ID, p.Patient_ID, p.Doctor_ID, p.Billing_ID, p.Date_Prescribed,
          p.Medication_Name, p.Dosage, p.Frequency, p.Start_Date, p.End_Date, 
          p.Status, p.Refill_Times, p.Upcoming_Refill
      FROM 
          Prescription p
      WHERE 
          p.Patient_ID = ? 
          AND p.End_Date > CURDATE();
    `;

  try {
    console.log("Executing query to fetch medications for patient:", patientId);
    const [rows] = await db.query(sql, [patientId]); 
    console.log("Medications fetched:", rows);
    return rows;
  } catch (error) {
    console.error("Error fetching medications:", error);
    throw error;
  }
}

export async function getAllergies(patientId) {
  const sql = `
      SELECT 
          a.Allergy_ID, a.Allergy_Name, a.Reaction
      FROM 
          Allergy a
      WHERE 
          a.Patient_ID = ?;
  `;

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(sql, [patientId]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function getMedicalHistory(patientId) {
  const sql = `
      SELECT 
          mh.Record_ID, mh.Description, mh.Date_Of_Entry, mh.Notes
      FROM 
          Medical_History mh
      WHERE 
          mh.Patient_ID = ?;
  `;

  const connection = await db.getConnection();
  try {
    const [rows] = await db.query(sql, [patientId]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

// export async function updatePatientDetails(patientId, patientData) {
//   const { FName, LName, Email, Phone, Address } = patientData;
//   const sql = `
//       UPDATE Patient
//       SET 
//           FName = ?, 
//           LName = ?, 
//           Email = ?, 
//           Phone = ?, 
//           Address = ?
//       WHERE Patient_ID = ?;
//   `;
//   const values = [FName, LName, Email, Phone, Address, patientId];

//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();
//     await connection.query(sql, values);
//     await connection.commit();
//     return { message: "Patient details updated successfully" };
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

export async function insertPatient(userId) {
  const insertPatientQuery = `INSERT INTO Patient (Patient_ID, Health_Statistics, Health_History) 
                                VALUES (?, NULL, NULL)`;
  try {
    const [patientResult] = await db.query(insertPatientQuery, [userId]);
    return patientResult.insertId; 
  } catch (err) {
    console.error("Error adding patient:", err);
    throw err;
  }
}

export async function insertInsurance(insurance) {
  const { Insurance_Provider, Coverage_Details, Expiry_Date } = insurance;
  const coverageJson = JSON.stringify(Coverage_Details); // Convert Coverage_Details to JSON format

  const insertInsuranceQuery = `INSERT INTO Insurance (Insurance_Provider, Coverage_Details, Expiry_Date) VALUES (?, ?, ?)`;

  try {
    const [insuranceResult] = await db.query(insertInsuranceQuery, [
      Insurance_Provider,
      coverageJson,
      Expiry_Date,
    ]);

    return insuranceResult.insertId; 
  } catch (err) {
    console.error("Error adding insurance:", err);
    throw err;
  }
}

export async function updatePatientWithInsurance(patientId, insuranceId) {
  console.log("Updating patient with insurance:", { patientId, insuranceId });
  const updatePatientInsuranceQuery = `UPDATE Patient SET Insurance_ID = ? WHERE Patient_ID = ?`;

  try {
    const [result] = await db.query(updatePatientInsuranceQuery, [
      insuranceId,
      patientId,
    ]);
    console.log("Update result:", result); 
  } catch (err) {
    console.error("Error updating patient with insurance:", err);
    throw err;
  }
}

export async function addPatient(patientData) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const roleId = await getRoleId(patientData.user.Role);
    const userId = await addUser(patientData.user, roleId);
    const patientId = await insertPatient(userId);

    if (patientData.insurance) {
      console.log("Adding insurance for patient:", patientId);
      const insuranceId = await insertInsurance(patientData.insurance);
      await updatePatientWithInsurance(userId, insuranceId);
    }

    await connection.commit();
    return { patientId, userId };
  } catch (err) {
    await connection.rollback();
    console.error("Error adding patient:", err);
    throw err;
  } finally {
    connection.release();
  }
}

export const selectPatientByID = async (patientID) => {
  const query = "SELECT * FROM Patients WHERE Patient_ID = ?"; 
  try {
    const [results] = await db.query(query, [patientID]);
    return results[0]; 
  } catch (err) {
    console.error("Error fetching patient:", err);
    throw err;
  }
};

export async function selectInsuranceDetails(userID) {
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

    if (results.length === 0) {
      console.log("Insurance details not found for the user.");
      return null;
    }

    const insuranceDetails = results[0];

    insuranceDetails.Insurance_Coverage = parseCoverage(
      insuranceDetails.Coverage_Details
    );

    if (insuranceDetails.Expiry_Date) {
      insuranceDetails.Expiry_Date = formatDate(insuranceDetails.Expiry_Date);
    }
    return insuranceDetails; 
  } catch (err) {
    console.error("Error selecting insurance details:", err);
    throw err; 
  }
}

function parseCoverage(coverageData) {
  if (!coverageData) {
    return "N/A";
  }

  try {
    const coverage = JSON.parse(coverageData);

    if (coverage && coverage.percentage) {
      return coverage.percentage; 
    } else {
      console.log("Coverage percentage not found in the data.");
      return "N/A"; 
    }
  } catch (parseError) {
    console.error("Error parsing Coverage_Details JSON:", parseError);
    return "Invalid JSON"; 
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const formattedDate = date.toISOString().split("T")[0];
  return formattedDate;
}

export async function updatePatientDetails(data) {
  const query = `
    UPDATE User
    SET 
      FName = ?,
      MidName = ?,
      LName = ?,
      Gender = ?,
      Phone = ?,
      Email = ?,
      Address = ?,
      Updated_At = NOW()
    WHERE National_ID = ?
  `;

  try {
    const { firstName, middleName, lastName, gender, phone, email, address, nationalId } = data;

    const [result] = await db.query(query, [
      firstName,
      middleName,
      lastName,
      gender,
      phone,
      email,
      address,
      nationalId,
    ]);

    if (result.affectedRows === 0) {
      throw new Error(`No user found with National ID: ${nationalId}`);
    }

    console.log("Patient details updated successfully.");
    return result;
  } catch (err) {
    console.error("Error updating patient details:", err);
    throw err;
  }
}

export async function updateInsuranceDetails(nationalId, data) {
  const selectQuery = `
    SELECT Insurance_ID
    FROM User
    INNER JOIN Patient ON Patient_ID = User.User_ID
    WHERE National_ID = ?
  `;

  const updateQuery = `
    UPDATE Insurance
    SET 
      Insurance_Provider = ?,
      Coverage_Details = ?,
      Expiry_Date = ?
    WHERE Insurance_ID = ?
  `;

  try {
    // Fetch Insurance_ID based on National_ID
    const [selectResult] = await db.query(selectQuery, [nationalId]);

    if (selectResult.length === 0) {
      throw new Error(`No insurance record found for National ID: ${nationalId}`);
    }

    const insuranceId = selectResult[0].Insurance_ID;

    // Prepare data for update
    const { provider, coverage, expireDate, image } = data;
    const coverageDetails = JSON.stringify({ percentage: coverage, image });

    const [updateResult] = await db.query(updateQuery, [provider, coverageDetails, expireDate, insuranceId]);

    if (updateResult.affectedRows === 0) {
      throw new Error(`No insurance record updated for Insurance ID: ${insuranceId}`);
    }

    console.log("Insurance details updated successfully.");
    return updateResult;
  } catch (err) {
    console.error("Error updating insurance details:", err);
    throw err;
  }
}

function handleCoverageError() {
  console.error("There was an issue with the coverage data.");
  return "Invalid JSON"; 
}

export async function verifyPatientInsurance(insuranceData) {
  const {
    Insurance_ID,
    Insurance_Provider,
    Policy_Number,
    Coverage_Details,
    Expiry_Date,
  } = insuranceData;

  const sql = `INSERT INTO Insurance (Insurance_ID, Insurance_provider, Policy_Number, Coverage_Details, Expiry_Date) VALUES (?, ?, ?, ?)`;

  const values = [
    Insurance_ID,
    Insurance_Provider,
    Policy_Number,
    Coverage_Details,
    Expiry_Date,
  ];

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(sql, values);
    await connection.commit();
    return { message: "Insurance added successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPatientHealthStatistics(patientId) {
  const query = `SELECT Health_Statistics FROM Patient WHERE Patient_ID = ?`;

  try {
    const [rows] = await db.query(query, [patientId]);

    if (rows.length === 0 || !rows[0].Health_Statistics) {
      console.warn("No health statistics found for patient ID:", patientId);
    return null; // Gracefully return null if no data is found
    }

    const healthStatistics = JSON.parse(rows[0].Health_Statistics);

    return {
      latestBloodPressure: 
        healthStatistics.Blood_Pressure?.[healthStatistics.Blood_Pressure.length - 1] || {
          Systolic: "N/A",
          Diastolic: "N/A",
          Date: "N/A",
        },
      latestWeight: 
        healthStatistics.Weight?.[healthStatistics.Weight.length - 1] || { Weight_kg: "N/A" },
      latestHeight: 
        healthStatistics.Height?.[healthStatistics.Height.length - 1] || { Height_cm: "N/A" },
      vaccinationHistory: healthStatistics.Vaccination_History || [],
      chronicDiseases: getLatestChronicDiseases(healthStatistics.Chronic_Diseases || {}),
      allergies: healthStatistics.Allergies || [],
    };
  } catch (error) {
    console.error("Error fetching patient health statistics:", error.message);
    throw error;
  }
}



function getLatestChronicDiseases(chronicDiseases) {
  const latestDiseases = {};

  if (!chronicDiseases || typeof chronicDiseases !== "object") {
    return latestDiseases; // Return an empty object if input is invalid
  }

  for (const diseaseName in chronicDiseases) {
    if (chronicDiseases.hasOwnProperty(diseaseName)) {
      const diseaseData = chronicDiseases[diseaseName];

      if (Array.isArray(diseaseData) && diseaseData.length > 0) {
        // Sort the data by date in descending order
        diseaseData.sort((a, b) => new Date(b.Date) - new Date(a.Date));

        // Store the latest disease record
        latestDiseases[diseaseName] = diseaseData[0];
      }
    }
  }

  return latestDiseases;
}

