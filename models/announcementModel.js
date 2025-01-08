import { db } from "../db.js";

export async function getUserByEmail(email) {
  const query = `SELECT User_ID, FName, LName, Email FROM User WHERE Email = ?`;
  const [result] = await db.execute(query, [email]);
  return result.length ? result[0] : null; // Return the full user data, not just User_ID
}

export async function insertAnnouncement(
  title,
  content,
  targetUser,
  priority,
  createdBy
) {
  const query = `
        INSERT INTO Announcements (Title, Content, Target_User, Priority, Created_By)
        VALUES (?, ?, ?, ?, ?)
    `;
  await db.execute(query, [title, content, targetUser, priority, createdBy]);
}

export async function getNotification(userId) {
  try {
    const query = `
        SELECT 
          a.Announcement_ID, 
          a.Title, 
          a.Content, 
          a.Priority, 
          a.Created_By, 
          a.created_at, 
          CONCAT(u.FName, ' ', u.LName) AS Created_By_Name
        FROM 
          Announcements a
        JOIN 
          User u
        ON 
          a.Created_By = u.User_ID
        WHERE 
          a.Target_User = ?
        ORDER BY 
          a.created_at DESC;
      `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error("Error fetching notifications: " + error.message);
  }
}
