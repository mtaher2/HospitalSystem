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