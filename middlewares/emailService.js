import nodemailer from "nodemailer";

async function sendEmail(to, userName, password) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "guhospitalms@gmail.com",
      pass: "keto ayay vujy qsuz",
    },
  });

  const mailOptions = {
    from: "guhospitalms@gmail.com",
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
