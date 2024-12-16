const { db } = require('../db');

const Patient = {
    async addPatient(patientData) {
        const { National_ID, FName, MidName, LName, Email, Phone, Address, Gender, Insurance_ID } = patientData;
        const sql = `INSERT INTO User (National_ID, FName, MidName, LName, Email, Phone, Address, Gender, Role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?); INSERT INTO Patient (Patient_ID, Insurance_ID) VALUES (LAST_INSERT_ID(), ?)`;
        const values = [National_ID, FName, MidName, LName, Email, Phone, Address, Gender, 3, Insurance_ID];
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(sql, values);
            await connection.commit();
            return { message: 'Patient added successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async getPatients() {
        const sql = 'SELECT * FROM User INNER JOIN Patient ON User.User_ID = Patient.Patient_ID WHERE Role = 3';
        const [rows] = await db.query(sql);
        return rows;
    }
    
};

module.exports = Patient;

//verify Patient Insurance
async function verifyPatientInsurance(insuranceData) {
    const { Insurance_ID, Insurance_Provider, Policy_Number, Coverage_Details, Expiry_Date } = insuranceData;

    const sql = `INSERT INTO Insurance (Insurance_ID, Insurance_provider, Policy_Number, Coverage_Details, Expiry_Date) VALUES (?, ?, ?, ?)`;

    const values = [Insurance_ID, Insurance_Provider, Policy_Number, Coverage_Details, Expiry_Date];

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

export { verifyPatientInsurance };