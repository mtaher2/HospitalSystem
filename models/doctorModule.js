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
export { getAllDoctorsByDepartment };
