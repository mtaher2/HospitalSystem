import { db } from "../db.js";

export async function getAllDoctorsByDepartment(departmentId) {
  if (!departmentId) {
    throw new Error("Invalid department ID");
  }

  const sql = `
    SELECT 
        d.Doctor_ID, 
        d.Specialty, 
        d.Availability, 
        d.ProfileDetails, 
        u.FName, 
        u.LName, 
        u.Email, 
        u.Phone
    FROM 
        Doctor d
    JOIN 
        User u ON d.Doctor_ID = u.User_ID
    WHERE 
        d.Department_ID = ?;
  `;

  try {
    const [rows] = await db.query(sql, [departmentId]);
    return rows;
  } catch (error) {
    console.error("Error fetching doctors by department:", error.message);
    throw error;
  }
}

export async function getSpecialties() {
  try {
    const query = "SELECT DISTINCT Specialty FROM Doctor";
    const [rows] = await db.query(query);
    return rows.map((row) => row.Specialty);
  } catch (error) {
    console.error("Error fetching specialties:", error.message);
    throw error;
  }
}

export async function getAvailableDays(specialty) {
  if (!specialty) {
    throw new Error("Invalid specialty");
  }

  const query = `
    SELECT Availability 
    FROM Doctor 
    WHERE Specialty = ?;
  `;

  try {
    const [rows] = await db.query(query, [specialty]);
    const availability = rows.map((row) => JSON.parse(row.Availability));
    const allDays = availability.flatMap((entry) =>
      entry.map((day) => day.day)
    );
    return [...new Set(allDays)]; // Unique days
  } catch (error) {
    console.error("Error fetching available days:", error.message);
    throw error;
  }
}

export async function getAvailableTimes(specialty, day) {
  if (!specialty || !day) {
    throw new Error("Invalid specialty or day");
  }

  const query = `
      SELECT Availability 
      FROM Doctor 
      WHERE Specialty = ?
    `;

  try {
    const [rows] = await db.query(query, [specialty]);
    const availability = rows
      .flatMap((row) => JSON.parse(row.Availability))
      .filter((entry) => entry.day === day)
      .flatMap((entry) => entry.available_hours);

    return [...new Set(availability)]; // Unique times
  } catch (error) {
    console.error("Error fetching available times:", error.message);
    throw error;
  }
}

export async function getDoctorsByTime(specialty, day, time) {
  if (!specialty || !day || !time) {
    throw new Error("Invalid specialty, day, or time");
  }

  const query = `
    SELECT d.Doctor_ID, u.FName, u.LName, d.ProfileDetails, d.Amount_P, d.Room_ID
    FROM Doctor d
    JOIN User u ON d.Doctor_ID = u.User_ID
    WHERE d.Specialty = ?
      AND JSON_CONTAINS(d.Availability, JSON_OBJECT('day', ?, 'available_hours', JSON_ARRAY(?)))
  `;

  try {
    const [rows] = await db.query(query, [specialty, day, time]);
    return rows;
  } catch (error) {
    console.error("Error fetching doctors by time:", error.message);
    throw error;
  }
}

export async function getDoctorsBySpecialty(specialty) {
  const [rows] = await db.execute(
    'SELECT * FROM Doctors WHERE Specialty = ?',
    [specialty]
  );
  return rows;
}

export async function getDoctorProfile(doctorID) {
  const query = `
    SELECT u.FName, u.LName, u.National_ID, u.Gender, 
           JSON_UNQUOTE(JSON_EXTRACT(d.ProfileDetails, '$.degree')) AS Degree,
           JSON_UNQUOTE(JSON_EXTRACT(d.ProfileDetails, '$.university')) AS University,
           JSON_UNQUOTE(JSON_EXTRACT(d.ProfileDetails, '$.experiences')) AS Experiences,
           dep.Name AS DepartmentName
    FROM Doctor d
    JOIN User u ON d.Doctor_ID = u.User_ID
    JOIN Department dep ON d.Department_ID = dep.Department_ID  -- Join the Department table
    WHERE d.Doctor_ID = ?
  `;

  try {
    const [rows] = await db.query(query, [doctorID]);
    if (rows.length === 0) {
      throw new Error('Doctor not found');
    }
    const doctor = rows[0];
    doctor.Experiences = JSON.parse(doctor.Experiences); 
    return doctor; 
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    throw error;
  }
}

export async function getTimeBookedBefore() {
  try {
    const query = `
      SELECT Appointment_ID, Doctor_ID, Appointment_Date, Appointment_Time, Status
      FROM Appointment
      WHERE Status = 'Scheduled';
    `;

    const [rows] = await db.execute(query);

    return rows;
  } catch (error) {
    console.error('Error fetching appointment data:', error);
    throw new Error('Failed to fetch scheduled appointments.');
  }
}

export async function getDoctorAppointments(doctorID) {
  const query = `
  SELECT 
      a.Appointment_ID,
      a.Appointment_Date,
      a.Appointment_Time,
      a.Status,
      a.Room_ID,
      a.Patient_ID,
      u.FName AS Patient_First_Name,
      u.LName AS Patient_Last_Name,
      r.Floor_Number,
      r.Description AS Room_Description
  FROM 
      Appointment a
  JOIN 
      User u ON a.Patient_ID = u.User_ID
  JOIN 
      Room r ON a.Room_ID = r.Room_ID
  WHERE 
      a.Doctor_ID = ? 
      AND a.Appointment_Date >= NOW() 
  ORDER BY 
      a.Appointment_Date ASC, a.Appointment_Time ASC;`;

  try {
      const [rows] = await db.execute(query, [doctorID]);

      return rows.map((row) => ({
          appointmentID: row.Appointment_ID,
          appointmentDate: row.Appointment_Date.toISOString().split("T")[0], 
          appointmentTime: row.Appointment_Time, 
          status: row.Status,
          roomID: row.Room_ID,
          patientName: `${row.Patient_First_Name} ${row.Patient_Last_Name}`,
          floorNumber: row.Floor_Number,
          roomDescription: row.Room_Description,
      }));
  } catch (error) {
      console.error("Error fetching doctor appointments:", error);
      throw error;
  }
}

export async function filterDoctorAppointments(doctorID, filters = {}) {
  let query = `
    SELECT 
        a.Appointment_ID,
        a.Appointment_Date,
        a.Appointment_Time,
        a.Status,
        a.Room_ID,
        a.Patient_ID,
        u.FName AS Patient_First_Name,
        u.LName AS Patient_Last_Name,
        r.Floor_Number,
        r.Description AS Room_Description
    FROM 
        Appointment a
    JOIN 
        User u ON a.Patient_ID = u.User_ID
    JOIN 
        Room r ON a.Room_ID = r.Room_ID
    WHERE 
        a.Doctor_ID = ? 
        AND a.Status = 'Scheduled'
        AND a.Appointment_Date >= NOW()`;

  const queryParams = [doctorID];

  console.log("Filter Parameters: Doctor ID =", doctorID, "Filters:", filters);

  if (filters.appointmentDate) {
    // Convert the input date to UTC date string for comparison
    const utcDate = new Date(filters.appointmentDate + 'T21:00:00.000Z');
    query += ` AND DATE(a.Appointment_Date) = DATE(?)`;
    queryParams.push(utcDate);
  }

  if (filters.patientName) {
    // Split the search term into parts to search first and last names separately
    const nameParts = filters.patientName.trim().split(/\s+/);
    const conditions = [];
    const params = [];

    nameParts.forEach(part => {
      conditions.push(`(u.FName LIKE ? OR u.LName LIKE ?)`);
      params.push(`%${part}%`, `%${part}%`);
    });

    query += ` AND (${conditions.join(' AND ')})`;
    queryParams.push(...params);
  }

  query += ` ORDER BY a.Appointment_Date ASC, a.Appointment_Time ASC`;

  try {
    const [rows] = await db.execute(query, queryParams);
    console.log("Appointments fetched:", rows);
    return rows.map((row) => ({
      appointmentID: row.Appointment_ID,
      appointmentDate: row.Appointment_Date.toISOString().split("T")[0],
      appointmentTime: row.Appointment_Time,
      status: row.Status,
      roomID: row.Room_ID,
      patientName: `${row.Patient_First_Name} ${row.Patient_Last_Name}`,
      floorNumber: row.Floor_Number,
      roomDescription: row.Room_Description,
      patientID: row.Patient_ID,
    }));
  } catch (error) {
    console.error("Error fetching doctor appointments with filters:", error);
    throw error;
  }
}

export async function getLabSuggestions(query) {
  const sql = `
      SELECT Lab_Name AS name, Description AS description, Lab_ID AS id
      FROM Lab
      WHERE Lab_Name LIKE ? OR Description LIKE ?
      LIMIT 10
  `;
  const values = [`${query}%`, `${query}%`]; // Ensure we match only starting with the entered character
  const [results] = await db.execute(sql, values);
  return results;
}

export async function getRadiologySuggestions(query) {
  const sql = `
      SELECT Scan_Name AS name, Description AS description, Radiology_ID AS id
      FROM Radiology
      WHERE Scan_Name LIKE ? OR Description LIKE ?
      LIMIT 10
  `;
  const values = [`${query}%`, `${query}%`]; // Ensure we match only starting with the entered character
  const [results] = await db.execute(sql, values);
  return results;
}

export async function getLabData(labName) {
  const query = 'SELECT `Lab_ID`, `Cost` FROM `Lab` WHERE `Lab_Name` = ?';
  const [rows] = await db.query(query, [labName]);
  return rows;
}

export async function getPatientInsurance(patientId) {
  const query = 'SELECT `Insurance_ID` FROM `Patient` WHERE `Patient_ID` = ?';
  const [rows] = await db.query(query, [patientId]);
  return rows.length ? rows[0].Insurance_ID : null;
}

export async function createLabOrder(patientId, doctorId, labId, billingId) {
  const query = `
    INSERT INTO Lab_Order (Patient_ID, Doctor_ID, Lab_ID, Status, Billing_ID)
    VALUES (?, ?, ?, "Pending", ?)
  `;
  const values = [patientId, doctorId, labId, billingId];
  const [result] = await db.query(query, values);
  return result.insertId;
}

export async function getRadiologyData(scanName) {
  const query = 'SELECT `Radiology_ID`, `Cost` FROM `Radiology` WHERE `Scan_Name` = ?';
  const [rows] = await db.query(query, [scanName]);
  return rows;
}

// Create Radiology Order
export async function createRadiologyOrder(patientId, doctorId, radiologyId, billingId) {
  const query = `
    INSERT INTO Radiology_Order (Patient_ID, Doctor_ID, Radiology_ID, Status, Results, Billing_ID)
    VALUES (?, ?, ?, "Pending", NULL, ?)
  `;
  const values = [patientId, doctorId, radiologyId, billingId];
  const [result] = await db.query(query, values);
  return result.insertId;
}

export async function insertPrescription(prescription) {
  const query = `
    INSERT INTO Prescription 
    (Patient_ID, Doctor_ID, Billing_ID, Medication_Name, Dosage, Frequency, Start_Date, End_Date, Status, Refill_Times) 
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'Active', ?)
  `;
  const { Patient_ID, Doctor_ID, Medication_Name, Dosage, Frequency, Start_Date, End_Date, Refill_Times } = prescription;
  await db.execute(query, [
    Patient_ID,
    Doctor_ID,
    Medication_Name,
    Dosage,
    Frequency,
    Start_Date,
    End_Date,
    Refill_Times,
  ]);
}

// Function to fetch medication suggestions
export async function getMedicationSuggestions(query) {
  try {
    const [rows] = await db.execute(
      "SELECT Medication_ID, Medication_Name, Stock_Level FROM Pharmacy WHERE Medication_Name LIKE ?",
      [`${query}%`]
    );
    return rows;
  } catch (error) {
    throw new Error("Error fetching medication suggestions: " + error.message);
  }
}

// Function to validate a medication's existence and stock level
export async function validateMedication(name) {
  try {
    const [rows] = await db.execute(
      "SELECT Medication_ID, Stock_Level FROM Pharmacy WHERE Medication_Name = ?",
      [name]
    );
    if (rows.length === 0) {
      throw new Error(`Medication "${name}" not found.`);
    }
    if (rows[0].Stock_Level <= 1) {
      throw new Error(`Medication "${name}" is out of stock.`);
    }
    return rows[0]; // Return medication details if valid
  } catch (error) {
    throw new Error(error.message);
  }
}

// Function to add a prescription
export async function addPrescription(prescription) {
  try {
    const {
      patientId,
      doctorId,
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      refillTimes,
    } = prescription;

    await db.execute(
      `INSERT INTO Prescription 
        (Patient_ID, Doctor_ID, Billing_ID, Medication_Name, Dosage, Frequency, Start_Date, End_Date, Status, Refill_Times)
        VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'Active', ?)`,
      [patientId, doctorId, name, dosage, frequency, startDate, endDate, refillTimes]
    );
  } catch (error) {
    throw new Error("Error adding prescription: " + error.message);
  }
}

export async function getPrescriptions(filters) {
  const { patientId, doctorId, status } = filters;
  
  let query = `
    SELECT 
      Prescription_ID,
      Medication_Name,
      Dosage,
      Frequency,
      Start_Date,
      End_Date,
      Status,
      Refill_Times
    FROM Prescription
    WHERE Patient_ID = ? AND Doctor_ID = ?
  `;
  
  const params = [patientId, doctorId];
  
  if (status) {
    query += ' AND Status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY Start_Date DESC';
  
  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    throw error;
  }
}

export async function updatePrescription(prescriptionId, updates) {
  const fields = [];
  const values = [];
  
  // Build the SET clause dynamically based on provided updates
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const query = `
    UPDATE Prescription 
    SET ${fields.join(', ')}
    WHERE Prescription_ID = ?
  `;
  
  values.push(prescriptionId);
  
  try {
    const [result] = await db.execute(query, values);
    if (result.affectedRows === 0) {
      throw new Error('Prescription not found');
    }
    return true;
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
}