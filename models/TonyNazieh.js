import { db } from "../db.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export async function getPatientRecords(patientID) {
    const query = `
    SELECT 
        mr.Record_ID,
        mr.Diagnosis,
        mr.Treatment_Plan,
        mr.Medications_Prescribed,
        mr.Lab_Tests,
        mr.Radiology_Reports,
        mr.Date AS Record_Date,
        mr.Created_At,
        mr.Updated_At,
        u.FName AS Doctor_First_Name,
        u.LName AS Doctor_Last_Name
    FROM 
        Medical_Record mr
    JOIN 
        User u ON mr.Doctor_ID = u.User_ID
    WHERE 
        mr.Patient_ID = ? 
    ORDER BY 
        mr.Date DESC;`;

    try {
        const [rows] = await db.execute(query, [patientID]);

        return rows.map((row) => ({
            recordID: row.Record_ID,
            diagnosis: row.Diagnosis,
            treatmentPlan: row.Treatment_Plan,
            medicationsPrescribed: JSON.parse(row.Medications_Prescribed),
            labTests: JSON.parse(row.Lab_Tests),  
            radiologyReports: JSON.parse(row.Radiology_Reports), 
            recordDate: row.Record_Date.toISOString().split("T")[0],  
            createdAt: row.Created_At,
            updatedAt: row.Updated_At,
            doctorName: `${row.Doctor_First_Name} ${row.Doctor_Last_Name}`,
        }));
    } catch (error) {
        console.error("Error fetching patient records:", error);
        throw error;
    }
}

export async function getAllergiesForPatient(patientID) {
    // ...
        const query = `
    SELECT 
        mr.Record_ID,
        JSON_UNQUOTE(JSON_EXTRACT(mr.Health_History, '$.Allergies')) AS Allergies,
        u.FName AS Doctor_First_Name,
        u.LName AS Doctor_Last_Name
    FROM 
        Medical_Record mr
    JOIN 
        User u ON mr.Doctor_ID = u.User_ID
    WHERE 
        mr.Patient_ID = ? 
    AND JSON_UNQUOTE(JSON_EXTRACT(mr.Health_History, '$.Allergies')) IS NOT NULL
    ORDER BY 
        mr.Date DESC;`;

        try {
            const [rows] = await db.execute(query, [patientID]);

            return rows.map((row) => ({
                recordID: row.Record_ID,
                allergies: row.Allergies,  // هنا تم استخدام القيم المستخرجة من JSON
                doctorName: `${row.Doctor_First_Name} ${row.Doctor_Last_Name}`,
            }));
        } catch (error) {
            console.error("Error fetching allergies for patient:", error);
            throw error;
        }
    }
export async function getPrescriptionsForPatient(patientID) {
    const query = `
    SELECT 
        p.Prescription_ID,
        p.Medication_Name,
        p.Dosage,
        p.Frequency,
        p.Start_Date,
        p.End_Date,
        p.Status,
        u.FName AS Doctor_First_Name,
        u.LName AS Doctor_Last_Name
    FROM 
        Prescription p
    JOIN 
        User u ON p.Doctor_ID = u.User_ID
    WHERE 
        p.Patient_ID = ?
    ORDER BY 
        p.Start_Date DESC;`;

    try {
        const [rows] = await db.execute(query, [patientID]);

        return rows.map((row) => ({
            prescriptionID: row.Prescription_ID,
            medicationName: row.Medication_Name,
            dosage: row.Dosage,
            frequency: row.Frequency,
            startDate: row.Start_Date.toISOString().split("T")[0], // تنسيق التاريخ YYYY-MM-DD
            endDate: row.End_Date ? row.End_Date.toISOString().split("T")[0] : null, // تنسيق التاريخ YYYY-MM-DD
            status: row.Status,
            doctorName: `${row.Doctor_First_Name} ${row.Doctor_Last_Name}`,
        }));
    } catch (error) {
        console.error("Error fetching prescriptions for patient:", error);
        throw error;
    }
}
export async function setChronicDiseaseMedicationPlan(patientID, doctorID, treatmentPlan) {
    const query = `
    INSERT INTO Medical_Record (Patient_ID, Doctor_ID, Treatment_Plan, Date, Created_At, Updated_At)
    VALUES (?, ?, ?, CURDATE(), NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      Treatment_Plan = VALUES(Treatment_Plan),
      Updated_At = NOW();`;

    try {
        await db.execute(query, [patientID, doctorID, treatmentPlan]);
        return { message: "Chronic disease medication plan set successfully." };
    } catch (error) {
        console.error("Error setting chronic disease medication plan:", error);
        throw error;
    }
}
export async function updateMedicationPlanForPatient(patientID, doctorID, newTreatmentPlan) {
    const query = `
    UPDATE Medical_Record
    SET Treatment_Plan = ?, Updated_At = NOW()
    WHERE Patient_ID = ? AND Doctor_ID = ?;`;

    try {
        const [result] = await db.execute(query, [newTreatmentPlan, patientID, doctorID]);

        if (result.affectedRows > 0) {
            return { message: "Treatment plan updated successfully." };
        } else {
            return { message: "No records updated. Please check the Patient ID and Doctor ID." };
        }
    } catch (error) {
        console.error("Error updating treatment plan:", error);
        throw error;
    }
}

export async function orderLabForPatientt(labID) {
    const checkLabQuery = `SELECT COUNT(*) AS count FROM Lab WHERE Lab_ID = ?`;

    try {
        const [rows] = await db.execute(checkLabQuery, [labID]);
        if (rows[0].count === 0) {
            throw new Error("Lab_ID does not exist in the Lab table.");
        }

        const insertQuery = `
      INSERT INTO Lab_Order (Patient_ID, Lab_ID, Status, Created_At, Updated_At)
      VALUES (?, ?, 'Pending', NOW(), NOW());`;

        await db.execute(insertQuery, [ labID]);
        return { message: "Lab order created successfully." };
    } catch (error) {
        console.error("Error while ordering lab:", error);
        throw error;
    }
}

export async function OrderRadiologyforPatient( radiologyID) {
    // Query to check if Radiology_ID exists
    const checkRadiologyQuery = `SELECT COUNT(*) AS count FROM Radiology WHERE Radiology_ID = ?`;

    try {
        // Validate Radiology_ID
        const [radiologyRows] = await db.execute(checkRadiologyQuery, [radiologyID]);
        if (radiologyRows[0].count === 0) {
            throw new Error("Radiology_ID does not exist in the Radiology table.");
        }

        // Query to insert radiology order
        const insertRadiologyOrderQuery = `
            INSERT INTO Radiology_Order (Patient_ID, Radiology_ID, Doctor_ID, Billing_ID, Status, Created_At, Updated_At)
            VALUES (?, ?, ?, ?, 'Pending', NOW(), NOW());
        `;

        // Execute insertion
        await db.execute(insertRadiologyOrderQuery, [ radiologyID]);

        return { message: "Radiology order created successfully." };
    } catch (error) {
        console.error("Error while ordering radiology:", error);
        throw error;
    }
}
export async function sendEmergencyAlert(title, content, targetRole, targetUser, priority, createdBy, startDate, endDate) {
    const query = `
    INSERT INTO Announcements (title, content, Target_Role, Target_User, start_date, end_date, priority, created_by, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());`;

    try {
        await db.execute(query, [title, content, targetRole, targetUser, startDate, endDate, priority, createdBy]);
        return { message: "Emergency alert sent successfully." };
    } catch (error) {
        console.error("Error while sending emergency alert:", error);
        throw error;
    }
}
export async function sendMessageToStaff(title, content, targetRole, targetUser, priority, createdBy, startDate, endDate) {
    const query = `
    INSERT INTO Announcements (title, content, Target_Role, Target_User, start_date, end_date, priority, created_by, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());`;

    try {
        await db.execute(query, [title, content, targetRole, targetUser, startDate, endDate, priority, createdBy]);
        return { message: "Message sent to staff successfully." };
    } catch (error) {
        console.error("Error while sending message to staff:", error);
        throw error;
    }
}
export async function handleLeaveRequest(attendanceID, action, notes = null) {
    const query = `
    UPDATE Attendance_Record 
    SET 
      Status = ?, 
      notes = ?, 
      Date = NOW()
    WHERE Attendance_ID = ?;`;

    const validActions = {
        Approve: 'Leave',
        Reject: 'Absent',
    };

    if (!validActions[action]) {
        throw new Error("Invalid action. Use 'Approve' or 'Reject'.");
    }

    try {
        await db.execute(query, [validActions[action], notes, attendanceID]);
        return {
            message: `Leave request has been ${action === 'Approve' ? 'approved' : 'rejected'} successfully.`
        };
    } catch (error) {
        console.error("Error handling leave request:", error);
        throw error;
    }
}
export async function manageStaffSchedules(employeeId, shift, startDate, endDate) {
    const query = `
    UPDATE Employee
    SET Shift = ?, Updated_At = NOW()
    WHERE Employee_ID = ?;
  `;

    try {
        await db.execute(query, [shift, employeeId]);
        console.log(`Schedule updated for employee ${employeeId} to ${shift} shift.`);
    } catch (error) {
        console.error("Error while updating staff schedule:", error);
        throw error;
    }
}










