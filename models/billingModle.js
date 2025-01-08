import { db } from "../db.js";

export async function getBillingDetails(billingId) {
  const sql = `
        SELECT 
            b.Billing_ID, b.Patient_ID, b.Amount, b.Payment_Status, b.Payment_Method
        FROM 
            Bill b
        WHERE 
            b.Billing_ID = ?;
    `;

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(sql, [billingId]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function createInvoice(patientId, amount, insuranceId) {
  const sql = `
    INSERT INTO Billing (Patient_ID, Amount, Payment_Status, Insurance_ID)
    VALUES (?, ?, 'Unpaid', ?);
  `;
  const values = [patientId, amount, insuranceId];

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Perform the insertion
    await connection.query(sql, values);

    // Query to get the last inserted Billing_ID using LAST_INSERT_ID()
    const [result] = await connection.query('SELECT LAST_INSERT_ID() AS Billing_ID');
    
    const billingId = result[0]?.Billing_ID; // Ensure we access the correct result

    await connection.commit();

    // Return the Billing_ID along with the success message
    return { 
      message: "Invoice created successfully", 
      billingId: billingId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}



export async function getPendingBills() {
  const connection = await db.getConnection();
  try {
    const sql = 'SELECT * FROM Bill WHERE Payment_Status = "Pending"';
    const [rows] = await connection.query(sql);
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function processPayment(billingId, paymentMethod) {
  const connection = await db.getConnection();
  try {
    const updateSql =
      'UPDATE Bill SET Payment_Status = "Paid", Payment_Method = ? WHERE Billing_ID = ?';
    const [result] = await connection.query(updateSql, [
      paymentMethod,
      billingId,
    ]);
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyInsuranceCoverage(insuranceId, amount) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = "SELECT Coverage_Details FROM Insurance WHERE Insurance_ID = ?";
    const [rows] = await connection.query(sql, [insuranceId]);

    if (rows.length === 0) {
      throw new Error("Insurance record not found");
    }

    const coverageDetails = JSON.parse(rows[0].Coverage_Details);
    const coveragePercentage = parseFloat(coverageDetails.percentage);

    if (isNaN(coveragePercentage)) {
      throw new Error("Invalid coverage details");
    }
    const coveredAmount = (coveragePercentage / 100) * amount;
    const remainingAmount = amount - coveredAmount;

    await connection.commit();
    return { coveredAmount, remainingAmount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function fetchBillingDetails(patientId, paymentStatus) {
  try {
    let query = `
        SELECT 
          Billing.Billing_ID, 
          Billing.Amount, 
          Billing.Invoice_Date, 
          Billing.Payment_Status, 
          Billing.Payment_Method, 
          Insurance.Coverage_Details
        FROM Billing
        LEFT JOIN Insurance ON Billing.Insurance_ID = Insurance.Insurance_ID
        WHERE Billing.Patient_ID = ?
      `;

    const queryParams = [patientId];

    if (paymentStatus) {
      query += ` AND Billing.Payment_Status = ?`;
      queryParams.push(paymentStatus);
    }

    const [rows] = await db.execute(query, queryParams);
    return rows.map((row) => {
      const coverageDetails = row.Coverage_Details
        ? JSON.parse(row.Coverage_Details)
        : null;
      return {
        Billing_ID: row.Billing_ID,
        Amount: row.Amount,
        Invoice_Date: row.Invoice_Date,
        Payment_Status: row.Payment_Status,
        Payment_Method: row.Payment_Method,
        Coverage_Percentage: coverageDetails
          ? coverageDetails.percentage
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching billing details:", error);
    throw error;
  }
}

export async function fetchBillingDetailsByBilling(patientId, billingId) {
  const query = "SELECT * FROM Billing WHERE Patient_ID = ? AND Billing_ID = ?";
  const [result] = await db.query(query, [patientId, billingId]);
  return result;
}

export async function getPaidBillsByPatientId(patientId) {
  const query = `
    SELECT Billing_ID, Patient_ID, Amount, Payment_Status, Payment_Method, Invoice_Date, Insurance_ID, Date_payment
    FROM Billing
    WHERE Patient_ID = ? AND Payment_Status = 'Paid';
  `;

  try {
    const [result] = await db.execute(query, [patientId]);
    return result;
  } catch (error) {
    console.error("Error fetching paid bills for patient:", error);
    throw error;
  }
}

// Fetch unpaid bills for a specific patient by Patient_ID
export async function getUnpaidBillsByPatientId(patientId) {
  const query = `
    SELECT Billing_ID, Patient_ID, Amount, Payment_Status, Payment_Method, Invoice_Date, Insurance_ID
    FROM Billing
    WHERE Patient_ID = ? AND Payment_Status = 'Unpaid';
  `;

  try {
    const [result] = await db.execute(query, [patientId]);
    return result;
  } catch (error) {
    console.error("Error fetching unpaid bills for patient:", error);
    throw error;
  }
}

export async function getFilteredBills(filters) {
  const { date, patient, status } = filters;

  let query = `
    SELECT 
      b.Billing_ID, 
      b.Patient_ID, 
      b.Amount, 
      b.Payment_Status, 
      b.Date_payment, 
      u.FName AS Patient_FName, 
      u.LName AS Patient_LName
    FROM Billing b
    JOIN User u ON b.Patient_ID = u.User_ID
    WHERE 1=1
  `;

  const queryParams = [];

  if (date) {
    query += ` AND b.Date_payment = ?`;
    queryParams.push(date);
  }

  if (patient) {
    query += ` AND (u.FName LIKE ? OR u.LName LIKE ?)`;
    queryParams.push(`%${patient}%`, `%${patient}%`);
  }

  if (status) {
    query += ` AND b.Payment_Status = ?`;
    queryParams.push(status);
  }

  try {
    const [rows] = await db.execute(query, queryParams); // Adjust `db.execute` as per your database library
    
    // Format the Date_payment as yyyy-mm-dd
    rows.forEach(row => {
      if (row.Date_payment) {
        row.Date_payment = row.Date_payment.toISOString()
        .split("T")[0]
        .replace(/(\d{4}-\d{2}-\d{2})/, (match) => {
          const date = new Date(match);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split("T")[0];
        });
      }
    });

    return rows;
  } catch (error) {
    console.error("Error fetching filtered bills:", error);
    throw error;
  }
}
