import { db } from "../db.js";

export async function getFilteredMedications(name) {
  try {
    const query = `
        SELECT 
          Medication_ID, 
          Medication_Name, 
          Stock_Level, 
          Expiration_Date, 
          Amount,
          CASE 
            WHEN Stock_Level > 0 THEN 'Available' 
            ELSE 'Out of Stock' 
          END AS Status
        FROM 
          Pharmacy
        WHERE 
          Medication_Name LIKE ?;
      `;
    const filterValue = `${name}%`;
    const [rows] = await db.execute(query, [filterValue]);
    return rows;
  } catch (error) {
    throw new Error("Error filtering medications: " + error.message);
  }
}

export async function getAllMedications() {
  try {
    const query = `
        SELECT 
          Medication_ID, 
          Medication_Name, 
          Stock_Level, 
          Expiration_Date, 
          Amount,
          CASE 
            WHEN Stock_Level > 0 THEN 'Available' 
            ELSE 'Out of Stock' 
          END AS Status
        FROM 
          Pharmacy;
      `;
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    throw new Error("Error fetching medications: " + error.message);
  }
}

export async function getGroupedPrescriptions() {
  try {
    const query = `
          SELECT 
            p.Patient_ID,
            p.Doctor_ID,
            DATE(p.Date_Prescribed) AS Date_Prescribed,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'Prescription_ID', p.Prescription_ID,
                'Medication_Name', p.Medication_Name,
                'Dosage', p.Dosage,
                'Frequency', p.Frequency,
                'Status', p.Status,
                'Upcoming_Refill_test', p.Upcoming_Refill
              )
            ) AS Prescriptions,
            u.FName,
            u.LName
          FROM Prescription p
          JOIN User u ON p.Patient_ID = u.User_ID
          WHERE p.Refill_Times >= 1
          GROUP BY p.Patient_ID, p.Doctor_ID, DATE(p.Date_Prescribed)
          ORDER BY DATE(p.Date_Prescribed) DESC
        `;

    const [results] = await db.execute(query);
    return results.map((row) => ({
      Patient_ID: row.Patient_ID,
      Doctor_ID: row.Doctor_ID,
      Date_Prescribed: row.Date_Prescribed,
      Prescriptions: JSON.parse(row.Prescriptions),
      FName: row.FName,
      LName: row.LName,
    }));
  } catch (error) {
    console.error("Error fetching grouped prescriptions:", error);
    throw error;
  }
}

export async function createBillingAndUpdatePrescriptions(prescriptions) {
  if (!prescriptions || prescriptions.length === 0) {
    throw new Error("No prescriptions provided");
  }

  try {
    const prescriptionQuery = `
            SELECT Prescription_ID, Patient_ID, Doctor_ID, Medication_Name, Refill_Times
            FROM Prescription
            WHERE Prescription_ID IN (${prescriptions
              .map((id) => `'${id.prescriptionId}'`)
              .join(", ")})
          `;
    const [prescriptionDetails] = await db.execute(prescriptionQuery);

    if (prescriptionDetails.length === 0) {
      throw new Error("No prescriptions found");
    }

    const medicationNames = prescriptionDetails
      .map((p) => `'${p.Medication_Name}'`)
      .join(", ");
    const pharmacyQuery = `
            SELECT Medication_Name, Amount
            FROM Pharmacy
            WHERE Medication_Name IN (${medicationNames})
          `;
    const [medicationDetails] = await db.execute(pharmacyQuery);

    let totalAmount = 0;
    prescriptionDetails.forEach((prescription) => {
      const medication = medicationDetails.find(
        (med) => med.Medication_Name === prescription.Medication_Name
      );
      if (medication) {
        totalAmount += medication.Amount;
      }
    });

    const billingQuery = `
            INSERT INTO Billing (Patient_ID, Amount, Payment_Status, Payment_Method, Invoice_Date)
            VALUES (?, ?, 'Unpaid', 'Cash', NOW())
          `;
    const [billingResult] = await db.execute(billingQuery, [
      prescriptionDetails[0].Patient_ID,
      totalAmount,
    ]);

    const billingID = billingResult.insertId;

    // Prepare Upcoming_Refill values for each prescription
    const updatePrescriptionQuery = `
            UPDATE Prescription
            SET Billing_ID = ?, Upcoming_Refill = ?, Refill_Times = CASE 
              WHEN Refill_Times > 0 THEN Refill_Times - 1
              ELSE 0
            END
            WHERE Prescription_ID = ?
          `;

    // Loop through each prescription and execute the update for each one
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const startDate = prescription.startDate ? prescription.startDate : null;

      await db.execute(updatePrescriptionQuery, [
        billingID,
        startDate, // Pass startDate for Upcoming_Refill
        prescription.prescriptionId,
      ]);
    }

    return { success: true, billingID };
  } catch (error) {
    console.error("Error in createBillingAndUpdatePrescriptions:", error);
    throw new Error(
      "An error occurred while creating billing and updating prescriptions"
    );
  }
}
