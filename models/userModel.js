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

export { addUser, deleteUser, selectUser };