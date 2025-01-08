import { db } from "../db.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export async function getAllUpcomingAppointments() {
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
              p.FName AS Patient_First_Name,
              p.LName AS Patient_Last_Name,
              r.Floor_Number,
              r.Description
              FROM 
                Appointment a
              JOIN 
                User u ON a.Doctor_ID = u.User_ID
              JOIN 
                User p ON a.Patient_ID = p.User_ID
              JOIN 
                  Room r ON a.Room_ID = r.Room_ID
              WHERE 
                a.Appointment_Date > NOW() AND a.Status = 'Scheduled'
              ORDER BY 
                a.Appointment_Date ASC;`;

  try {
    const [rows] = await db.execute(query);
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
      patientName: `${row.Patient_First_Name} ${row.Patient_Last_Name}`,
    }));
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    throw error;
  }
}

export async function getAllPastAppointments() {
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
              p.FName AS Patient_First_Name,
              p.LName AS Patient_Last_Name,
              r.Floor_Number,
              r.Description
              FROM 
                Appointment a
              JOIN 
                User u ON a.Doctor_ID = u.User_ID
              JOIN 
                User p ON a.Patient_ID = p.User_ID
              JOIN 
                  Room r ON a.Room_ID = r.Room_ID
              WHERE 
                a.Appointment_Date < NOW() AND a.Status = 'Scheduled'
              ORDER BY 
                a.Appointment_Date ASC;`;

  try {
    const [rows] = await db.execute(query);
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
      patientName: `${row.Patient_First_Name} ${row.Patient_Last_Name}`,
    }));
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    throw error;
  }
}

// Updated Model Function
export async function getFilteredAppointments(filters, activeTab) {
  const connection = await db.getConnection();
  try {
      let sql = `
          SELECT 
              a.Appointment_ID, 
              a.Patient_ID, 
              a.Doctor_ID, 
              a.Appointment_Date, 
              a.Appointment_Time, 
              a.Status, 
              a.Notes, 
              a.Room_ID, 
              r.Floor_Number,
              d.FName AS Doctor_FName, 
              d.LName AS Doctor_LName, 
              p.FName AS Patient_FName, 
              p.LName AS Patient_LName
          FROM 
              Appointment a
          JOIN 
              Room r ON a.Room_ID = r.Room_ID
          JOIN 
              User d ON a.Doctor_ID = d.User_ID
          JOIN 
              User p ON a.Patient_ID = p.User_ID
          WHERE 1=1`;

      const params = [];

      // Apply filters dynamically
      if (filters.date) {
          sql += " AND a.Appointment_Date = ?";
          params.push(filters.date);
      }

      if (filters.time) {
          sql += " AND a.Appointment_Time = ?";
          params.push(filters.time);
      }

      if (filters.doctor) {
          sql += " AND (CONCAT(d.FName, ' ', d.LName) LIKE ? OR CONCAT(d.LName, ' ', d.FName) LIKE ?)";
          params.push(`%${filters.doctor}%`, `%${filters.doctor}%`);
      }

      if (filters.patient) {
          sql += " AND (CONCAT(p.FName, ' ', p.LName) LIKE ? OR CONCAT(p.LName, ' ', p.FName) LIKE ?)";
          params.push(`%${filters.patient}%`, `%${filters.patient}%`);
      }

      if (filters.room) {
          sql += " AND a.Room_ID = ?";
          params.push(filters.room);
      }

      // Add logic for tab selection
      if (activeTab === 'upcoming') {
          sql += " AND a.Appointment_Date >= CURDATE() AND a.Status = 'Scheduled'";
      } else if (activeTab === 'missed') {
          sql += " AND a.Appointment_Date < CURDATE() AND a.Status = 'Scheduled'";
      }

      const [rows] = await connection.query(sql, params);
      rows.forEach(row => {
        row.Appointment_Date = row.Appointment_Date.toISOString()
        .split("T")[0]
        .replace(/(\d{4}-\d{2}-\d{2})/, (match) => {
          const date = new Date(match);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split("T")[0];
        });
    });
    return rows.length ? rows : null;
  } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch appointments. Please try again later.');
  } finally {
      connection.release();
  }
}

export async function createBillingRecord(billingData) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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
    await connection.commit();

    return billingID;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function convertTo24HourFormat(time) {
  const [hour, minute, second] = time.split(":");
  const period = time.includes("PM") ? "PM" : "AM";

  let hour24 = parseInt(hour);

  if (period === "PM" && hour24 !== 12) {
    hour24 += 12;
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0;
  }

  const secondPart = second ? second.substring(0, 2) : "00";

  return `${String(hour24).padStart(2, "0")}:${minute}:${secondPart}`;
}

export async function scheduleAppointment(appointmentData, billingID) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log(
      "appointmentData in the database to check time",
      appointmentData
    );

    const appointmentQuery = `
        INSERT INTO Appointment 
        (Patient_ID, Doctor_ID, Appointment_Date, Appointment_Time, Status, Notes, Room_ID, Billing_ID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;

    // Extract time portion and AM/PM
    const timeParts = appointmentData.Appointment_Time.split(" "); // Split by space
    const timeOnly =
      timeParts.length === 3 ? timeParts[1] + " " + timeParts[2] : timeParts[1]; // Extract time and AM/PM

    // Debugging: Log the extracted time and AM/PM
    console.log("Extracted time and AM/PM:", timeOnly);

    const convertedTime = convertTo24HourFormat(timeOnly);

    const [appointmentResult] = await connection.execute(appointmentQuery, [
      appointmentData.Patient_ID,
      appointmentData.Doctor_ID,
      appointmentData.Appointment_Date,
      convertedTime,
      appointmentData.Status || "Scheduled",
      appointmentData.Notes || null,
      appointmentData.Room_ID,
      billingID,
    ]);

    const appointmentID = appointmentResult.insertId;
    await connection.commit();

    return appointmentID;
  } catch (error) {
    await connection.rollback();
    console.error("Error in scheduling appointment:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function createAppointmentWithBilling(appointmentData) {
  try {
    const billingID = await createBillingRecord(appointmentData);
    console.log("Billing ID:", billingID);
    const appointmentID = await scheduleAppointment(appointmentData, billingID);
    return { Appointment_ID: appointmentID, Billing_ID: billingID };
  } catch (error) {
    throw new Error(
      `Failed to create appointment with billing: ${error.message}`
    );
  }
}

export async function rescheduleAppointment(appointmentData) {
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

export async function getUpcomingAppointments(patientID) {
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function cancelAppointment(appointmentId) {
  const cancelAppointmentQuery = `UPDATE Appointment SET Status = 'Canceled', Billing_ID = NULL WHERE Appointment_ID = ?`;
  const getBillingIdQuery = `SELECT Billing_ID FROM Appointment WHERE Appointment_ID = ?`;
  const deleteBillingQuery = `DELETE FROM Billing WHERE Billing_ID = ?`;

  try {
    const [billingResult] = await db.execute(getBillingIdQuery, [
      appointmentId,
    ]);

    if (billingResult.length === 0) {
      throw new Error("No billing record found for this appointment.");
    }

    const billingId = billingResult[0].Billing_ID;

    const [updateResult] = await db.execute(cancelAppointmentQuery, [
      appointmentId,
    ]);

    const [deleteResult] = await db.execute(deleteBillingQuery, [billingId]);

    const invoiceFilePath = path.join(
      __dirname,
      "..",
      "invoices",
      `invoice_${billingId}.pdf`
    );
    console.log("Trying to delete:", invoiceFilePath);

    fs.access(invoiceFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("File does not exist:", invoiceFilePath);
        return;
      }

      fs.unlink(invoiceFilePath, (err) => {
        if (err) {
          console.error("Error deleting invoice PDF:", err.message);
        } else {
          console.log(`Invoice PDF deleted successfully: ${invoiceFilePath}`);
        }
      });
    });

    if (updateResult.affectedRows > 0 && deleteResult.affectedRows > 0) {
      return {
        success: true,
        message:
          "Appointment canceled, billing record deleted, and invoice PDF removed successfully.",
      };
    } else {
      return {
        success: false,
        message:
          "Failed to cancel appointment, delete billing record, or remove invoice PDF.",
      };
    }
  } catch (error) {
    console.error(
      "Error canceling appointment or deleting billing record or invoice PDF:",
      error
    );
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function getPastAppointments(patientID) {
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
      a.Patient_ID = ? AND a.Appointment_Date < NOW() AND a.Status = 'Scheduled'
    ORDER BY 
      a.Appointment_Date ASC;
  `;

  try {
    const [rows] = await db.execute(query, [patientID]);
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

export async function fetchAppointmentDetailsByPatientId(patientId, billingId) {
  try {
    let query = `
      SELECT 
        a.Appointment_ID, 
        a.Patient_ID, 
        a.Doctor_ID, 
        a.Appointment_Date, 
        a.Appointment_Time, 
        a.Status, 
        a.Notes, 
        a.Room_ID, 
        a.Billing_ID,
        u.FName AS Doctor_FName,
        u.LName AS Doctor_LName
      FROM Appointment a
      LEFT JOIN User u ON a.Doctor_ID = u.User_ID
      WHERE a.Patient_ID = ? AND a.Billing_ID = ?
    `;

    const queryParams = [patientId, billingId];

    const [rows] = await db.execute(query, queryParams);

    if (!rows || rows.length === 0) {
      throw new Error(
        "No appointment details found for the given Patient ID and Billing ID"
      );
    }

    return rows.map((row) => ({
      Appointment_ID: row.Appointment_ID,
      Patient_ID: row.Patient_ID,
      Doctor_FName: row.Doctor_FName,
      Doctor_LName: row.Doctor_LName,
      Appointment_Date: row.Appointment_Date,
      Appointment_Time: row.Appointment_Time,
      Status: row.Status,
      Notes: row.Notes,
      Room_ID: row.Room_ID,
      Billing_ID: row.Billing_ID,
    }));
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    throw error;
  }
}


