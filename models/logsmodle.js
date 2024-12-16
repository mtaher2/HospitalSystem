async function createLogEntry(logData) {
    const { User_ID, Action, Device_Info, Status } = logData;

    const sql = `INSERT INTO Logs (User_ID, Action, Device_Info, Status) 
                 VALUES (?, ?, ?, ?)`;

    const values = [User_ID, Action, Device_Info, Status];

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query(sql, values);
        await connection.commit();
        return { message: 'Log entry created successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};