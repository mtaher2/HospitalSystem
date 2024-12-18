// Get available rooms
async function getAvailableRooms() {
    const sql = `
        SELECT r.Room_ID, r.Department_ID, r.Description, r.Floor_Number
        FROM Room r
        LEFT JOIN Appointment a ON r.Room_ID = a.Room_ID AND a.Status = 'Scheduled'
        LEFT JOIN Radiology ra ON r.Room_ID = ra.Radiology_Room
        LEFT JOIN Lab l ON r.Room_ID = l.Lab_Room
        WHERE r.Patient_ID IS NULL
          AND a.Appointment_ID IS NULL
          AND ra.Radiology_ID IS NULL
          AND l.Lab_ID IS NULL;
    `;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

export { getAvailableRooms };
async function getAvailableRooms() {
    const sql = `
        SELECT r.Room_ID, r.Department_ID, r.Description, r.Floor_Number
        FROM Room r
        LEFT JOIN Appointment a ON r.Room_ID = a.Room_ID AND a.Status = 'Scheduled'
        LEFT JOIN Radiology ra ON r.Room_ID = ra.Radiology_Room
        LEFT JOIN Lab l ON r.Room_ID = l.Lab_Room
        WHERE r.Patient_ID IS NULL
          AND a.Appointment_ID IS NULL
          AND ra.Radiology_ID IS NULL
          AND l.Lab_ID IS NULL;
    `;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
};
export { getAvailableRooms };