import nodemailer from "nodemailer";
import dotenv from 'dotenv';

async function sendEmail(to, userName, password) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email_send,
      pass: process.env.Pass_key,
    },
  });

  const mailOptions = {
    from: process.env.email_send,
    to,
    subject: "Welcome to Our Hospital System – Your Login Details",
    text: `
Dear ${userName},

Welcome to GU Hospital! We are excited to have you on board. Below are your login details to access our hospital system:
your Password is: ${password}

Please log in and update your password for security purposes. Should you have any questions or need assistance, feel free to contact us.

We look forward to supporting you in your journey with us!

Best regards,  
GU Hospital Team
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default sendEmail;
