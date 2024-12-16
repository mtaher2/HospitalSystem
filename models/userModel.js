import { db } from '../db.js';

// Add a new user
async function addUser(user) {
    const query = `INSERT INTO User (National_ID, Password, FName, MidName, LName, Email, Phone, Address, Role, Gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        const [results] = await db.query(query, [user.National_ID, user.Password, user.FName, user.MidName, user.LName, user.Email, user.Phone, user.Address, user.Role, user.Gender]);
        return results;
    } catch (err) {
        console.error('Error adding user:', err);
        throw err;
    }
}

// Delete a user by User_ID
async function deleteUser(userID) {
    const query = `DELETE FROM User WHERE User_ID = ?`;
    try {
        const [results] = await db.query(query, [userID]);
        return results;
    } catch (err) {
        console.error('Error deleting user:', err);
        throw err;
    }
}

// Select a user by User_ID
async function selectUser(userID) {
    const query = `SELECT * FROM User WHERE User_ID = ?`;
    try {
        const [results] = await db.query(query, [userID]);
        return results;
    } catch (err) {
        console.error('Error selecting user:', err);
        throw err;
    }
}

async function getNotificationByUserID(userId) {
    const sql = `
        SELECT 
            a.Announcement_ID, 
            a.Title, 
            a.Content, 
            a.Start_Date, 
            a.End_Date, 
            a.Priority, 
            a.Created_By, 
            a.Timestamp
        FROM 
            Announcements a
        LEFT JOIN 
            User u ON a.Target_Role = u.Role OR a.Target_User = u.User_ID
        WHERE 
            (a.Target_User = ? OR a.Target_Role = u.Role)
            AND a.Start_Date <= CURDATE()
            AND a.End_Date >= CURDATE()
            AND u.User_ID = ?
        ORDER BY 
            FIELD(a.Priority, 'High', 'Medium', 'Low'), 
            a.Timestamp DESC;
    `;

    const connection = await db.getConnection();

    try {
        const [rows] = await connection.query(sql, [userId, userId]);
        return rows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export { addUser, deleteUser, selectUser, getNotificationByUserID };