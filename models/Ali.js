export async function updatePatientStatus(patientId, status) {
    const query = `
      UPDATE Patient
      SET Status = ?, Updated_At = NOW()
      WHERE Patient_ID = ?;
    `;
  
    try {
      const [result] = await db.query(query, [status, patientId]);
  
      if (result.affectedRows === 0) {
        throw new Error(`No patient found with Patient ID: ${patientId}`);
      }
  
      console.log("Patient status updated successfully.");
      return result;
    } catch (err) {
      console.error("Error updating patient status:", err);
      throw err;
    }
  }
  
  export async function updateDiagnosisForPatient(patientId, diagnosis) {
    const query = `
      UPDATE Patient
      SET Diagnosis = ?, Updated_At = NOW()
      WHERE Patient_ID = ?;
    `;
  
    try {
      const [result] = await db.query(query, [diagnosis, patientId]);
  
      if (result.affectedRows === 0) {
        throw new Error(`No patient found with Patient ID: ${patientId}`);
      }
  
      console.log("Patient diagnosis updated successfully.");
      return result;
    } catch (err) {
      console.error("Error updating diagnosis for patient:", err);
      throw err;
    }
  }
  
  export async function updateAllergiesForPatient(patientId, allergies) {
    const deleteQuery = `DELETE FROM Allergy WHERE Patient_ID = ?;`;
    const insertQuery = `
      INSERT INTO Allergy (Patient_ID, Allergy_Name, Reaction)
      VALUES (?, ?, ?);
    `;
  
    const connection = await db.getConnection();
  
    try {
      await connection.beginTransaction();
  
      // Delete existing allergies
      await connection.query(deleteQuery, [patientId]);
  
      // Insert new allergies
      for (const allergy of allergies) {
        const { Allergy_Name, Reaction } = allergy;
        await connection.query(insertQuery, [patientId, Allergy_Name, Reaction]);
      }
  
      await connection.commit();
      console.log("Patient allergies updated successfully.");
    } catch (err) {
      await connection.rollback();
      console.error("Error updating allergies for patient:", err);
      throw err;
    } finally {
      connection.release();
    }
  }
  
  export async function getPatientPrescriptionHistory(patientId) {
    const query = `
      SELECT 
        Prescription_ID, Doctor_ID, Medication_Name, Dosage, Frequency, 
        Date_Prescribed, Start_Date, End_Date, Status, Refill_Times, Upcoming_Refill
      FROM 
        Prescription
      WHERE 
        Patient_ID = ?;
    `;
  
    try {
      const [rows] = await db.query(query, [patientId]);
  
      if (rows.length === 0) {
        console.warn("No prescription history found for patient ID:", patientId);
        return [];
      }
  
      console.log("Prescription history fetched successfully.");
      return rows;
    } catch (err) {
      console.error("Error fetching patient prescription history:", err);
      throw err;
    }
  }
//----------------------------------------------------------------------------------------  
export async function updateBillingStatusForPatient(patientId, billingId, newStatus) {
    const sql = `
      UPDATE Billing
      SET Payment_Status = ?
      WHERE Patient_ID = ? AND Billing_ID = ?;
    `;
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(sql, [newStatus, patientId, billingId]);
      await connection.commit();
  
      if (result.affectedRows === 0) {
        throw new Error("No billing record found or status unchanged");
      }
  
      return { message: "Billing status updated successfully" };
    } catch (error) {
      await connection.rollback();
      console.error("Error updating billing status:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function getBillingStatusForPatient(patientId) {
    const sql = `
      SELECT 
        Billing_ID, Amount, Payment_Status, Invoice_Date, Payment_Method
      FROM Billing
      WHERE Patient_ID = ?;
    `;
  
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql, [patientId]);
      return rows.map(row => ({
        Billing_ID: row.Billing_ID,
        Amount: row.Amount,
        Payment_Status: row.Payment_Status,
        Invoice_Date: row.Invoice_Date,
        Payment_Method: row.Payment_Method
      }));
    } catch (error) {
      console.error("Error fetching billing status for patient:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
//--------------------------------------------------------------------------
export async function getInventoryStockLevels() {
    const sql = `
      SELECT 
        Medication_ID, 
        Medication_Name, 
        Stock_Level 
      FROM Pharmacy;
    `;
  
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql);
      return rows.map(row => ({
        Medication_ID: row.Medication_ID,
        Medication_Name: row.Medication_Name,
        Stock_Level: row.Stock_Level,
      }));
    } catch (error) {
      console.error("Error fetching inventory stock levels:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function getLowStockItems() {
    const sql = `
      SELECT 
        Medication_ID, 
        Medication_Name, 
        Stock_Level, 
        Reorder_Level 
      FROM Pharmacy
      WHERE Stock_Level < Reorder_Level;
    `;
  
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql);
      return rows.map(row => ({
        Medication_ID: row.Medication_ID,
        Medication_Name: row.Medication_Name,
        Stock_Level: row.Stock_Level,
        Reorder_Level: row.Reorder_Level,
      }));
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function getExpirationAlerts(daysToAlert = 30) {
    const sql = `
      SELECT 
        Medication_ID, 
        Medication_Name, 
        Stock_Level, 
        Expiration_Date 
      FROM Pharmacy
      WHERE Expiration_Date <= DATE_ADD(CURDATE(), INTERVAL ? DAY);
    `;
  
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql, [daysToAlert]);
      return rows.map(row => ({
        Medication_ID: row.Medication_ID,
        Medication_Name: row.Medication_Name,
        Stock_Level: row.Stock_Level,
        Expiration_Date: row.Expiration_Date,
      }));
    } catch (error) {
      console.error("Error fetching expiration alerts:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
//----------------------------------------------------------------------
export async function addPrescription(prescription) {
    const sql = `
      INSERT INTO Prescription (
        Patient_ID, 
        Doctor_ID, 
        Billing_ID, 
        Date_Prescribed, 
        Medication_Name, 
        Dosage, 
        Frequency, 
        Start_Date, 
        End_Date, 
        Status, 
        Refill_Times, 
        Upcoming_Refill
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
  
    const values = [
      prescription.Patient_ID,
      prescription.Doctor_ID,
      prescription.Billing_ID,
      prescription.Date_Prescribed,
      prescription.Medication_Name,
      prescription.Dosage,
      prescription.Frequency,
      prescription.Start_Date,
      prescription.End_Date,
      prescription.Status || "Pending",
      prescription.Refill_Times,
      prescription.Upcoming_Refill,
    ];
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql, values);
      await connection.commit();
      return { message: "Prescription added successfully" };
    } catch (error) {
      await connection.rollback();
      console.error("Error adding prescription:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function getPrescriptions(filters) {
    const { patientId, doctorId, status, upcomingRefill } = filters;
  
    let sql = `
      SELECT 
        Prescription_ID, 
        Patient_ID, 
        Doctor_ID, 
        Billing_ID, 
        Date_Prescribed, 
        Medication_Name, 
        Dosage, 
        Frequency, 
        Start_Date, 
        End_Date, 
        Status, 
        Refill_Times, 
        Upcoming_Refill
      FROM Prescription
      WHERE 1 = 1
    `;
  
    const params = [];
    if (patientId) {
      sql += ` AND Patient_ID = ?`;
      params.push(patientId);
    }
    if (doctorId) {
      sql += ` AND Doctor_ID = ?`;
      params.push(doctorId);
    }
    if (status) {
      sql += ` AND Status = ?`;
      params.push(status);
    }
    if (upcomingRefill) {
      sql += ` AND Upcoming_Refill = ?`;
      params.push(upcomingRefill);
    }
  
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function updatePrescription(prescriptionId, updates) {
    let sql = `
      UPDATE Prescription
      SET 
    `;
    const fields = [];
    const values = [];
  
    // Dynamically generate query based on the fields to be updated
    if (updates.Refill_Times !== undefined) {
      fields.push("Refill_Times = ?");
      values.push(updates.Refill_Times);
    }
    if (updates.Upcoming_Refill !== undefined) {
      fields.push("Upcoming_Refill = ?");
      values.push(updates.Upcoming_Refill);
    }
    if (updates.Status !== undefined) {
      fields.push("Status = ?");
      values.push(updates.Status);
    }
  
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }
  
    sql += fields.join(", ");
    sql += ` WHERE Prescription_ID = ?`;
    values.push(prescriptionId);
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(sql, values);
      await connection.commit();
  
      if (result.affectedRows === 0) {
        throw new Error("No prescription found with the provided ID");
      }
  
      return { message: "Prescription updated successfully" };
    } catch (error) {
      await connection.rollback();
      console.error("Error updating prescription:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  export async function confirmPrescription(prescriptionId) {
    const sql = `
      UPDATE Prescription
      SET Status = 'Confirmed'
      WHERE Prescription_ID = ?;
    `;
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(sql, [prescriptionId]);
      await connection.commit();
  
      if (result.affectedRows === 0) {
        throw new Error("No prescription found with the provided ID");
      }
  
      return { message: "Prescription confirmed successfully" };
    } catch (error) {
      await connection.rollback();
      console.error("Error confirming prescription:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
    