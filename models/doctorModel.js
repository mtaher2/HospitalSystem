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
  const [rows] = await pool.execute(
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
    
    // Parse the experiences field into an array
    const doctor = rows[0];
    doctor.Experiences = JSON.parse(doctor.Experiences); // Parse experiences JSON string into an array

    return doctor; // Return the doctor data with the parsed experience array
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    throw error;
  }
}

