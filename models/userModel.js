import { db } from '../db.js';
import { randomBytes } from 'crypto';
// Add a new user
// Function to get the Role_ID based on the role name
async function getRoleId(roleName) {
    const getRoleIdQuery = `SELECT Role_ID FROM Roles WHERE Role_Name = ?`;

    try {
        const [roleResults] = await db.query(getRoleIdQuery, [roleName]);

        if (roleResults.length === 0) {
            throw new Error('Role not found');
        }

        return roleResults[0].Role_ID;
    } catch (err) {
        console.error('Error retrieving role:', err);
        throw err;
    }
}

async function addUser(user, roleId) {
    const insertUserQuery = `INSERT INTO User (National_ID, Password, FName, MidName, LName, Email, Phone, Address, Role, Gender) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [results] = await db.query(insertUserQuery, [
            user.National_ID,
            user.Password,
            user.FName,
            user.MidName,
            user.LName,
            user.Email,
            user.Phone,
            user.Address,
            roleId, 
            user.Gender
        ]);

        return results.insertId;  // Return the inserted User_ID
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
        if (results.length === 0) {
            console.log('User not found.');
        }
        return results;
    } catch (err) {
        console.error('Error selecting user:', err);
        throw err;
    }
}

export { addUser, deleteUser, selectUser};