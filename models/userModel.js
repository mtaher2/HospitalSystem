import { db } from "../db.js";
import { randomBytes } from "crypto";
// Add a new user
// Function to get the Role_ID based on the role name
async function getRoleId(roleName) {
  const getRoleIdQuery = `SELECT Role_ID FROM Roles WHERE Role_Name = ?`;

  try {
    const [roleResults] = await db.query(getRoleIdQuery, [roleName]);

    if (roleResults.length === 0) {
      throw new Error("Role not found");
    }

    return roleResults[0].Role_ID;
  } catch (err) {
    console.error("Error retrieving role:", err);
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
      user.Gender,
    ]);

    return results.insertId; // Return the inserted User_ID
  } catch (err) {
    console.error("Error adding user:", err);
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
    console.error("Error deleting user:", err);
    throw err;
  }
}

// Select a user by User_ID
async function selectUser(userID) {
  const query = `SELECT * FROM User WHERE User_ID = ?`;
  try {
    const [results] = await db.query(query, [userID]);
    if (results.length === 0) {
      console.log("User not found.");
    }
    return results;
  } catch (err) {
    console.error("Error selecting user:", err);
    throw err;
  }
}

function getDOBFromNationalID(nationalID) {
  const firstDigit = nationalID.charAt(0); // Get the first digit to check the century
  const year = nationalID.substring(1, 3); // Year is 2nd and 3rd digit
  const month = nationalID.substring(3, 5); // Month is 4th and 5th digit
  const day = nationalID.substring(5, 7); // Day is 6th and 7th digit

  let century = "";
  if (firstDigit === "3") {
    century = "20"; // Born in the 21st century
  } else if (firstDigit === "2") {
    century = "19"; // Born in the 20th century
  } else {
    throw new Error("Invalid National ID");
  }

  const fullYear = century + year;
  const dob = new Date(fullYear, month - 1, day);

  return dob;
}

// Function to calculate the age from DOB
function calculateAgeFromDOB(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  const dayDifference = today.getDate() - dob.getDate();

  // Adjust age if the birthday hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
}

// Select a user by National ID
async function selectUserByNationalID(nationalID) {
  const query = `
        SELECT User.*, Roles.Role_Name
        FROM User
        JOIN Roles ON User.Role = Roles.Role_ID
        WHERE User.National_ID = ?
    `;
  try {
    const [results] = await db.query(query, [nationalID]);
    return results; // Return the user data with the role
  } catch (err) {
    console.error("Error selecting user by National ID:", err);
    throw err;
  }
}

// Authenticate a user by National_ID and Password
async function authenticateUser(nationalId, password) {
  const query = `SELECT * FROM User WHERE National_ID = ? AND Password = ?`;
  try {
    const [results] = await db.query(query, [nationalId, password]);
    if (results.length === 0) {
      console.log(
        `No user found with National ID: ${nationalId} and provided password`
      );
      return null;
    }
    console.log("User authenticated successfully:", results[0]);
    return results[0]; // Return the first user if found, otherwise `null`
  } catch (err) {
    console.error("Error authenticating user:", err);
    throw err;
  }
}

async function updateProfilePhoto(userId, imagePath) {
  const query = `UPDATE User SET profile_photo = ? WHERE User_ID = ?`;
  try {
    const [results] = await db.query(query, [imagePath, userId]);
    return results;
  } catch (err) {
    console.error("Error updating user profile photo:", err);
    throw err;
  }
}

function generateRandomPassword(length) {
  return randomBytes(length).toString("base64").slice(0, length);
}

async function updateUserPasswordPlainText(
  nationalID,
  oldPassword,
  newPassword
) {
  const query = `
        SELECT Password 
        FROM User 
        WHERE National_ID = ?;
    `;

  try {
    const [results] = await db.query(query, [nationalID]);

    if (results.length === 0) {
      throw new Error("User not found");
    }

    const storedPassword = results[0].Password;
    // Compare the old password with the stored password (plain text)
    if (storedPassword !== oldPassword) {
      throw new Error("Old password is incorrect");
    }

    // Update the password and Updated_At timestamp
    const updateQuery = `
            UPDATE User 
            SET Password = ?, Updated_At = NOW() 
            WHERE National_ID = ?;
        `;
    await db.query(updateQuery, [newPassword, nationalID]);

    return { success: true, message: "Password updated successfully" };
  } catch (err) {
    console.error("Error updating password:", err);
    throw err;
  }
}

export {
  updateUserPasswordPlainText,
  generateRandomPassword,
  getRoleId,
  addUser,
  deleteUser,
  selectUser,
  authenticateUser,
  selectUserByNationalID,
  getDOBFromNationalID,
  calculateAgeFromDOB,
  updateProfilePhoto,
};
