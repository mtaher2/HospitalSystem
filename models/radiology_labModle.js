
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
}

// Get radiology reports
async function getRadiologyReports() {
    const sql = `
        SELECT 
            r.Radiology_Order_ID, r.Patient_ID, r.Report_Details, r.Status
        FROM 
            Radiology_Order r
        WHERE 
            r.Status = 'Completed';
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

export { getPendingRadiologyTests, getRadiologyReports };
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
export {getPendingRadiologyTests};