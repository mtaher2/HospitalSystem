import { db } from "../db.js";
import { randomBytes } from "crypto";

export async function getRoleId(roleName) {
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

export async function addUser(user, roleId) {
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

export async function deleteUser(userID) {
  const query = `DELETE FROM User WHERE User_ID = ?`;
  try {
    const [results] = await db.query(query, [userID]);
    return results;
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }
}

export async function selectUser(userID) {
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

export function getDOBFromNationalID(nationalID) {
  console.log("National ID:", nationalID);
  console.log("typeof National ID:", typeof nationalID);
  
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

export function calculateAgeFromDOB(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  const dayDifference = today.getDate() - dob.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
}

export async function selectUserByNationalID(nationalID) {
  const query = `
        SELECT User.*, Roles.Role_Name
        FROM User
        JOIN Roles ON User.Role = Roles.Role_ID
        WHERE User.National_ID = ?
    `;
  try {
    const [results] = await db.query(query, [nationalID]);
    return results; 
  } catch (err) {
    console.error("Error selecting user by National ID:", err);
    throw err;
  }
}

export async function authenticateUser(nationalId, password) {
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

export async function updateProfilePhoto(userId, imagePath) {
  const query = `UPDATE User SET profile_photo = ? WHERE User_ID = ?`;
  try {
    const [results] = await db.query(query, [imagePath, userId]);
    return results;
  } catch (err) {
    console.error("Error updating user profile photo:", err);
    throw err;
  }
}

export function generateRandomPassword(length) {
  return randomBytes(length).toString("base64").slice(0, length);
}


export async function payBill(billingId) {
    const query = `
        UPDATE Billing
        SET Payment_Status = 'Paid'
        WHERE Billing_ID = ?;
    `;
    try {
        const [result] = await db.query(query, [billingId]);
        return result; // Return affected rows or update status
    } catch (err) {
        console.error('Error paying bill:', err);
        throw err;
    }
}

export async function getAllInsuranceProviders() {
    const query = `
        SELECT Insurance_ID, Insurance_Provider, Policy_Number, 
               Coverage_Details, Expiry_Date
        FROM Insurance;
    `;
    try {
        const [results] = await db.query(query);
        return results; // Return all insurance providers
    } catch (err) {
        console.error('Error retrieving insurance providers:', err);
        throw err;
    }
}

export async function getAllDepartments() {
    const sql = `
        SELECT 
            Department_ID, Department_Name, Department_Head
        FROM 
            Department;
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

export async function updateUserPasswordPlainText(
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
    if (storedPassword !== oldPassword) {
      throw new Error("Old password is incorrect");
    }

    const updateQuery = `
            UPDATE User 
            SET Password = ?, Updated_At = NOW(), need_update = FALSE 
            WHERE National_ID = ?;
        `;
    await db.query(updateQuery, [newPassword, nationalID]);

    return { success: true, message: "Password updated successfully" };
  } catch (err) {
    console.error("Error updating password:", err);
    throw err;
  }
}