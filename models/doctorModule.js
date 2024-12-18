async function getAllDoctorsByDepartment(departmentId) {
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

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql, [departmentId]);
        return rows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
// Get available doctors by specialty
async function getAvailableDoctorsBySpecialty(specialty) {
    const sql = `
        SELECT 
            d.Doctor_ID, d.Specialty, d.Availability, d.ProfileDetails, 
            u.FName, u.LName, u.Email, u.Phone
        FROM 
            Doctor d
        JOIN 
            User u ON d.Doctor_ID = u.User_ID
        WHERE 
            d.Specialty = ? AND d.Availability = 'Available';
    `;

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(sql, [specialty]);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

// Get available time slots
async function getAvailableTimeSlots(doctorId, appointmentDate) {
    const sql = `
        SELECT 
            a.Appointment_Time
        FROM 
            Appointment a
        WHERE 
            a.Doctor_ID = ? 
            AND a.Appointment_Date = ?;
    `;
    
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(sql, [doctorId, appointmentDate]);
        return rows; // Return the list of timeslots
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

export { getAvailableDoctorsBySpecialty, getAvailableTimeSlots };
