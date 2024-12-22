// index.js
import sendEmail from './middlewares/emailService.js'; // Import the email sending function

const userName = 'Mohamed Medhat'; // Replace with actual user's name
const password = 'secureGeneratedPassword123'; // Replace with the generated password
const email = 'mohamed.taher@gu.edu.eg'; // Replace with the user's email

// Test the email sending function
sendEmail(email, userName, password);
