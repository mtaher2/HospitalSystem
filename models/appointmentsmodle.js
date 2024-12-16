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
            throw new Error('No appointments found for the given date');
        }

        await connection.commit();
        return rows; 
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
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
            throw new Error('No appointments found for the given doctor');
        }

        await connection.commit();
        return rows; 
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
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
            throw new Error('No appointments found for the given patient');
        }

        await connection.commit();
        return rows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
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
            throw new Error('No appointments found for the given time');
        }

        await connection.commit();
        return rows; 
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
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
            throw new Error('No appointments found for the given time');
        }

        await connection.commit();
        return rows; 
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
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
            throw new Error('No appointments found for the given room');
        }

        await connection.commit();
        return rows; 
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

async function scheduleAppointment(appointmentData) {
    const { Appointment_ID, Patient_ID, Doctor_ID, Appointment_Date, Appointment_Time, Room_ID} = appointmentData;

    const sql = `INSERT INTO Insurance (Appointment_ID, Patient_ID, Doctor_ID, Appointment_Date, Appointment_Time, 'Scheduled', Room_ID) VALUES (?,?,?,?,?,?)`;

    const values = [Appointment_ID, Patient_ID, Doctor_ID, Appointment_Date, Appointment_Time, Room_ID];

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query(sql, values);
        await connection.commit();
        return { message: 'Insurance added successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
async function rescheduleAppointment(appointmentData) {
    const { Appointment_ID, New_Appointment_Date, New_Appointment_Time } = appointmentData;

    const sql = `UPDATE Appointment 
                 SET Appointment_Date = ?, Appointment_Time = ?
                 WHERE Appointment_ID = ?`;

    const values = [New_Appointment_Date, New_Appointment_Time, Appointment_ID];

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const [result] = await connection.query(sql, values);

        if (result.affectedRows === 0) {
            throw new Error('Appointment not found');
        }

        await connection.commit();
        return { message: 'Appointment rescheduled successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
export {getAllAppointmentsForDay, filterAppointmentsByRoom, filterAppointmentsByPatient, filterAppointmentsByTime, filterAppointmentsByDoctor, scheduleAppointment, rescheduleAppointment};