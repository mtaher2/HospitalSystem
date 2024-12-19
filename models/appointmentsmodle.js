import { db } from "../db.js";

async function getAllAppointmentsForDay(date) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = `
            SELECT 
                a.Appointment_ID, a.Patient_ID, a.Doctor_ID, a.Appointment_Date, 
                a.Appointment_Time, a.Status, a.Notes, a.Room_ID, r.Floor_Number
            FROM 
                Appointment a
            JOIN 
                Room r ON a.Room_ID = r.Room_ID
            WHERE 
                a.Appointment_Date = ?`;

    const [rows] = await connection.query(sql, [date]);

    if (rows.length === 0) {
      throw new Error("No appointments found for the given date");
    }

    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function filterAppointmentsByDoctor(doctorId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = `
            SELECT 
                a.Appointment_ID, a.Patient_ID, a.Doctor_ID, a.Appointment_Date, 
                a.Appointment_Time, a.Status, a.Notes, a.Room_ID, r.Floor_Number
            FROM 
                Appointment a
            JOIN 
                Room r ON a.Room_ID = r.Room_ID
            WHERE 
                a.Doctor_ID = ?`;

    const [rows] = await connection.query(sql, [doctorId]);

    if (rows.length === 0) {
      throw new Error("No appointments found for the given doctor");
    }

    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function filterAppointmentsByPatient(patientId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = `
            SELECT 
                a.Appointment_ID, a.Patient_ID, a.Doctor_ID, a.Appointment_Date, 
                a.Appointment_Time, a.Status, a.Notes, a.Room_ID, r.Floor_Number
            FROM 
                Appointment a
            JOIN 
                Room r ON a.Room_ID = r.Room_ID
            WHERE 
                a.Patient_ID = ?`;

    const [rows] = await connection.query(sql, [patientId]);

    if (rows.length === 0) {
      throw new Error("No appointments found for the given patient");
    }

    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function filterAppointmentsByTime(time) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = `
            SELECT 
                a.Appointment_ID, a.Patient_ID, a.Doctor_ID, a.Appointment_Date, 
                a.Appointment_Time, a.Status, a.Notes, a.Room_ID, r.Floor_Number
            FROM 
                Appointment a
            JOIN 
                Room r ON a.Room_ID = r.Room_ID
            WHERE 
                a.Appointment_Time = ?`;

    const [rows] = await connection.query(sql, [time]);

    if (rows.length === 0) {
      throw new Error("No appointments found for the given time");
    }

    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function filterAppointmentsByRoom(roomId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sql = `
            SELECT 
                a.Appointment_ID, a.Patient_ID, a.Doctor_ID, a.Appointment_Date, 
                a.Appointment_Time, a.Status, a.Notes, a.Room_ID, r.Floor_Number
            FROM 
                Appointment a
            JOIN 
                Room r ON a.Room_ID = r.Room_ID
            WHERE 
                a.Room_ID = ?`;

    const [rows] = await connection.query(sql, [roomId]);

    if (rows.length === 0) {
      throw new Error("No appointments found for the given room");
    }

    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createBillingRecord(billingData) {
  const connection = await db.getConnection();
  try {
    // Start a transaction
    await connection.beginTransaction();

    // Insert billing into the Billing table
    const billingQuery = `
        INSERT INTO Billing 
        (Patient_ID, Amount, Payment_Status, Payment_Method, Invoice_Date, Insurance_ID) 
        VALUES (?, ?, ?, ?, ?, ?);
      `;
    const [billingResult] = await connection.execute(billingQuery, [
      billingData.Patient_ID,
      billingData.Amount,
      billingData.Payment_Status || "Unpaid",
      billingData.Payment_Method || "Cash",
      billingData.Invoice_Date ||
        new Date().toISOString().slice(0, 19).replace("T", " "),
      billingData.Insurance_ID || null,
    ]);

    const billingID = billingResult.insertId;

    // Commit the transaction
    await connection.commit();

    return billingID;
  } catch (error) {
    // Roll back the transaction in case of error
    await connection.rollback();
    throw error;
  } finally {
    // Release the connection
    connection.release();
  }
}

async function scheduleAppointment(appointmentData, billingID) {
  const connection = await db.getConnection();
  try {
    // Start a transaction
    await connection.beginTransaction();

    // Insert appointment into the Appointment table
    const appointmentQuery = `
        INSERT INTO Appointment 
        (Patient_ID, Doctor_ID, Appointment_Date, Appointment_Time, Status, Notes, Room_ID, Billing_ID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
    const [appointmentResult] = await connection.execute(appointmentQuery, [
      appointmentData.Patient_ID,
      appointmentData.Doctor_ID,
      appointmentData.Appointment_Date,
      appointmentData.Appointment_Time,
      appointmentData.Status || "Scheduled",
      appointmentData.Notes || null,
      appointmentData.Room_ID,
      billingID, // Use the generated Billing_ID
    ]);

    const appointmentID = appointmentResult.insertId;

    // Commit the transaction
    await connection.commit();

    return appointmentID;
  } catch (error) {
    // Roll back the transaction in case of error
    await connection.rollback();
    throw error;
  } finally {
    // Release the connection
    connection.release();
  }
}

// Example usage:
async function createAppointmentWithBilling(appointmentData) {
  try {
    const billingID = await createBillingRecord(appointmentData);
    const appointmentID = await scheduleAppointment(appointmentData, billingID);
    return { Appointment_ID: appointmentID, Billing_ID: billingID };
  } catch (error) {
    throw new Error(
      `Failed to create appointment with billing: ${error.message}`
    );
  }
}

async function rescheduleAppointment(appointmentData) {
  const { Appointment_ID, New_Appointment_Date, New_Appointment_Time } =
    appointmentData;

  const sql = `UPDATE Appointment 
                 SET Appointment_Date = ?, Appointment_Time = ?
                 WHERE Appointment_ID = ?`;

  const values = [New_Appointment_Date, New_Appointment_Time, Appointment_ID];

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(sql, values);

    if (result.affectedRows === 0) {
      throw new Error("Appointment not found");
    }

    await connection.commit();
    return { message: "Appointment rescheduled successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getUpcomingAppointments(patientID) {
  const query = `
      SELECT 
        a.Appointment_ID,
        a.Appointment_Date,
        a.Appointment_Time,
        a.Status,
        a.Room_ID,
        a.Billing_ID,
        u.FName AS Doctor_First_Name,
        u.LName AS Doctor_Last_Name,
        r.Floor_Number,
        r.Description
      FROM 
        Appointment a
      JOIN 
        User u ON a.Doctor_ID = u.User_ID
      JOIN 
        Room r ON a.Room_ID = r.Room_ID
      WHERE 
        a.Patient_ID = ? AND a.Appointment_Date > NOW() AND a.Status = 'Scheduled'
      ORDER BY 
        a.Appointment_Date ASC;
    `;

  try {
    const [rows] = await db.execute(query, [patientID]);

    console.log("SQL Query Result:", rows);
    return rows.map((row) => ({
      appointmentID: row.Appointment_ID,
      date: row.Appointment_Date.toISOString()
        .split("T")[0]
        .replace(/(\d{4}-\d{2}-\d{2})/, (match) => {
          const date = new Date(match);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split("T")[0];
        }),
      // Format YYYY-MM-DD
      time: row.Appointment_Time, // Format HH:MM:SS
      doctorName: `${row.Doctor_First_Name} ${row.Doctor_Last_Name}`,
      roomID: row.Room_ID,
      floorNumber: row.Floor_Number,
      Billing_ID: row.Billing_ID,
    }));
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    throw error;
  }
}

export async function cancelAppointment(appointmentId) {
    const cancelAppointmentQuery = `UPDATE Appointment SET Status = 'Canceled', Billing_ID = NULL WHERE Appointment_ID = ?`;
    const getBillingIdQuery = `SELECT Billing_ID FROM Appointment WHERE Appointment_ID = ?`;
    const deleteBillingQuery = `DELETE FROM Billing WHERE Billing_ID = ?`;
  
    try {
      // Step 1: Get the Billing_ID for the appointment
      const [billingResult] = await db.execute(getBillingIdQuery, [appointmentId]);
  
      if (billingResult.length === 0) {
        throw new Error("No billing record found for this appointment.");
      }
  
      const billingId = billingResult[0].Billing_ID;
  
      // Step 2: Update the appointment status to 'Canceled' and set Billing_ID to NULL
      const [updateResult] = await db.execute(cancelAppointmentQuery, [appointmentId]);
  
      // Step 3: Delete the Billing record associated with the Billing_ID
      const [deleteResult] = await db.execute(deleteBillingQuery, [billingId]);
  
      // Check if the appointment was successfully updated and the billing record deleted
      if (updateResult.affectedRows > 0 && deleteResult.affectedRows > 0) {
        return { success: true, message: 'Appointment canceled and billing record deleted successfully.' };
      } else {
        return { success: false, message: 'Failed to cancel appointment or delete billing record.' };
      }
    } catch (error) {
      console.error("Error canceling appointment or deleting billing record:", error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }
  }
  

export {
  createAppointmentWithBilling,
  getAllAppointmentsForDay,
  filterAppointmentsByRoom,
  filterAppointmentsByPatient,
  filterAppointmentsByTime,
  filterAppointmentsByDoctor,
  scheduleAppointment,
  rescheduleAppointment,
  getUpcomingAppointments,

};
