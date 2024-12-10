import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testConnection() {
    try {
        await db.getConnection();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Failed to connect to the database:', error);
    }
}

// Test the database connection on startup
testConnection();

// Export db and testConnection
export { db, testConnection };