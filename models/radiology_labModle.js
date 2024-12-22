async function getPendingRadiologyTests() {
    const sql = `SELECT * FROM Radiology_Order WHERE Status = 'Pending'`;

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

const { verifyInsuranceCoverage } = require('./billingModel');

async function getLabfile(labOrderId) {
    const sql = `SELECT 
        pu.FName AS Patient_First_Name,
        pu.MidName AS Patient_Middle_Name,
        pu.LName AS Patient_Last_Name,
        du.FName AS Doctor_First_Name,
        du.LName AS Doctor_Last_Name,
        l.Lab_Name,
        l.Description,
        l.Cost AS Lab_Cost,
        b.Amount AS Total_Charged,
        b.Payment_Status,
        p.Insurance_ID
    FROM Lab_Order lo
    JOIN Lab l ON lo.Lab_ID = l.Lab_ID
    JOIN Doctor d ON lo.Doctor_ID = d.Doctor_ID
    JOIN User du ON d.Doctor_ID = du.User_ID
    JOIN Patient p ON lo.Patient_ID = p.Patient_ID
    JOIN User pu ON p.Patient_ID = pu.User_ID
    LEFT JOIN Billing b ON lo.Lab_Order_ID = b.Billing_ID
    WHERE lo.Lab_Order_ID = ?;`;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql, [labOrderId]);
        if (rows.length > 0) {
            const updatedCharge = await verifyInsuranceCoverage(rows[0].Insurance_ID, rows[0].Total_Charged);
            rows[0].Total_Charged = updatedCharge;
        }
        return rows;
    } catch (error) {
        console.error('Error during database query or processing:', error);
        throw error;
    } finally {
        connection.release();
    }
}
async function getLabfile(labOrderId) {
    const sql = `SELECT 
        pu.FName AS Patient_First_Name,
        pu.MidName AS Patient_Middle_Name,
        pu.LName AS Patient_Last_Name,
        du.FName AS Doctor_First_Name,
        du.LName AS Doctor_Last_Name,
        l.Lab_Name,
        l.Description,
        l.Cost AS Lab_Cost,
        lo.Results,
        lo.Status AS Order_Status,
        b.Amount AS Total_Charged,
        b.Payment_Status,
        p.Insurance_ID
    FROM Lab_Order lo
    JOIN Lab l ON lo.Lab_ID = l.Lab_ID
    JOIN Doctor d ON lo.Doctor_ID = d.Doctor_ID
    JOIN User du ON d.Doctor_ID = du.User_ID
    JOIN Patient p ON lo.Patient_ID = p.Patient_ID
    JOIN User pu ON p.Patient_ID = pu.User_ID
    LEFT JOIN Billing b ON lo.Lab_Order_ID = b.Billing_ID
    WHERE lo.Lab_Order_ID = ?;`;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql, [labOrderId]);
        if (rows.length > 0) {
            const updatedCharge = await verifyInsuranceCoverage(rows[0].Insurance_ID, rows[0].Total_Charged);
            rows[0].Total_Charged = updatedCharge;
        }
        return rows;
    } catch (error) {
        console.error('Error during database query or processing:', error);
        throw error;
    } finally {
        connection.release();
    }
}


async function getRadiologyFile(radiologyOrderId) {  
    const sql = `SELECT 
        pu.FName AS Patient_First_Name,
        pu.MidName AS Patient_Middle_Name,
        pu.LName AS Patient_Last_Name,
        du.FName AS Doctor_First_Name,
        du.LName AS Doctor_Last_Name,
        r.Scan_Name,
        r.Description,
        r.Cost AS Radiology_Cost,
        ro.Results,
        ro.Status AS Order_Status,
        b.Amount AS Total_Charged,
        b.Payment_Status,
        p.Insurance_ID
    FROM Radiology_Order ro
    JOIN Radiology r ON ro.Radiology_ID = r.Radiology_ID
    JOIN Doctor d ON ro.Doctor_ID = d.Doctor_ID
    JOIN User du ON d.Doctor_ID = du.User_ID
    JOIN Patient p ON ro.Patient_ID = p.Patient_ID
    JOIN User pu ON p.Patient_ID = pu.User_ID
    LEFT JOIN Billing b ON ro.Radiology_Order_ID = b.Billing_ID
    WHERE ro.Radiology_Order_ID = ?;`;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql, [radiologyOrderId]);  
        if (rows.length > 0) {
            const updatedCharge = await verifyInsuranceCoverage(rows[0].Insurance_ID, rows[0].Total_Charged);
            rows[0].Total_Charged = updatedCharge;  
        }
        return rows;
    } catch (error) {
        console.error('Error during database query or processing:', error);
        throw error;
    } finally {
        connection.release();
    }
}


export {getPendingRadiologyTests, getLabfile};