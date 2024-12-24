import fs from "fs";
import pdf from "pdfkit";
import { fetchBillingDetailsByBilling } from "../models/billingModle.js";
import { fetchAppointmentDetailsByPatientId } from "../models/appointmentsmodle.js";
import { selectUser } from "../models/userModel.js";

export async function generateInvoicePdf(patientId, billingId) {
  const billingDetails = await fetchBillingDetailsByBilling(patientId, billingId);
  const PatientUserDetails = await selectUser(patientId);
  const appointmentDetails = await fetchAppointmentDetailsByPatientId(patientId, billingId);

  if (!billingDetails || billingDetails.length === 0 || !PatientUserDetails) {
    throw new Error("Billing or User details not found for the given IDs");
  }

  const billingDetail = billingDetails[0];
  const patient = PatientUserDetails[0];
  const appointment = appointmentDetails[0];

  const pdfPath = `./invoices/invoice_${billingId}.pdf`;
  const doc = new pdf({ margin: 50 });

  doc.pipe(fs.createWriteStream(pdfPath));

  const primaryColor = "#3058a6";
  const secondaryColor = "#A1D55D";
  const textColor = "#333333";
  const accentColor = "#f4f4f4";

  doc.registerFont("Roboto", "./public/fonts/Roboto-Regular.ttf");
  doc.registerFont("Roboto-Bold", "./public/fonts/Roboto-Bold.ttf");

  doc.rect(0, 0, 612, 60).fill(primaryColor);
  doc.fillColor("#ffffff").fontSize(20).font("Roboto-Bold").text("GU Hospital", 50, 20);
  doc.image("./public/images/logo.png", 500, 10, { width: 70 });

  doc.moveDown().fillColor(secondaryColor).fontSize(22).font("Roboto-Bold").text("INVOICE", { align: "center" });

  doc.moveDown(1);
  const detailBoxY = 100;
  doc.roundedRect(50, detailBoxY, 512, 160, 10).fill(accentColor); 
  doc.fillColor(textColor).fontSize(10).font("Roboto")
    .text(`Patient Name: ${patient.FName} ${patient.MidName} ${patient.LName}`, 60, detailBoxY + 10)
    .text(`National ID: ${patient.National_ID}`, 60, detailBoxY + 25)
    .text(`Phone: ${patient.Phone}`, 60, detailBoxY + 40)
    .text(`Email: ${patient.Email}`, 60, detailBoxY + 55);
  
  const billingBoxY = detailBoxY + 100;  
  doc.fillColor(textColor).fontSize(10).font("Roboto")
    .text(`Billing ID: ${billingDetail.Billing_ID}`, 60, billingBoxY)
    .text(`Invoice Date: ${new Date(new Date(billingDetail.Invoice_Date).setDate(new Date(billingDetail.Invoice_Date).getDate() + 1)).toISOString().split('T')[0]}`, 200, billingBoxY)
    .text(
      `Due Date: ${
        billingDetail.Date_payment
          ? (() => {
              const date = new Date(billingDetail.Date_payment);
              if (!isNaN(date)) {
                date.setDate(date.getDate() + 1);
                return date.toISOString().split("T")[0];
              }
              return "Invalid Date";
            })()
          : "Not Provided"
      }`,
      400,
      billingBoxY
    );    

  const paymentStatus = billingDetail.Payment_Status || "Unpaid";
  const statusColor = paymentStatus === "Paid" ? "#DFF2BF" : "#FFBABA";
  doc.roundedRect(400, detailBoxY + 60, 120, 20, 5).fill(statusColor);
  doc.fillColor(textColor).fontSize(12).font("Roboto-Bold").text(paymentStatus, 420, detailBoxY + 65);

  const appointmentBoxY = detailBoxY + 120;
  doc.roundedRect(50, appointmentBoxY, 512, 80, 10).fill(accentColor);
  doc.fillColor(textColor).fontSize(10).font("Roboto")
    .text(`Doctor: ${appointment.Doctor_FName} ${appointment.Doctor_LName}`, 60, appointmentBoxY + 10)
    .text(`Appointment Date: ${new Date(appointment.Appointment_Date).toISOString().split('T')[0]}`, 60, appointmentBoxY + 25)
    .text(`Appointment Time: ${appointment.Appointment_Time}`, 60, appointmentBoxY + 40)
    .text(`Status: ${appointment.Status}`, 60, appointmentBoxY + 55);

  const tableTop = appointmentBoxY + 100;
  doc.fillColor(primaryColor).font("Roboto-Bold").fontSize(10);
  doc.text("DESCRIPTION", 60, tableTop)
    .text("UNIT PRICE", 340, tableTop)
    .text("AMOUNT", 440, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).stroke(primaryColor);

  const items = [
    {
      description: "Hospital Service Fees",
      unitPrice: billingDetail.Amount,
      total: billingDetail.Amount,
    },
  ];

  doc.fillColor(textColor).font("Roboto");
  items.forEach((row, i) => {
    const y = tableTop + 30 + i * 20;
    doc.text(row.description, 60, y)
      .text(`$${Number(row.unitPrice).toFixed(2)}`, 340, y)
      .text(`$${Number(row.total).toFixed(2)}`, 440, y);
  });

  doc.moveDown(4);
  let finalAmount = parseFloat(billingDetail.Amount) || 0;
  if (billingDetail.Coverage_Percentage) {
    const coveragePercentage = parseFloat(billingDetail.Coverage_Percentage) || 0;
    const coverageAmount = (coveragePercentage / 100) * finalAmount;
    finalAmount -= coverageAmount;

    doc.fillColor(textColor).text(`Insurance Coverage: ${coveragePercentage}%`, 60, doc.y);
    doc.text(`Coverage Amount: $${coverageAmount.toFixed(2)}`, 60, doc.y + 20);
  }

  doc.fillColor(primaryColor).font("Roboto-Bold").fontSize(14).text(`Total: $${finalAmount.toFixed(2)}`, 400, doc.y + 40);

  doc.moveDown(2).fillColor(textColor).font("Roboto").fontSize(10)
    .text("Thank you for choosing our services!", { align: "center" });

  doc.end();
  console.log(`Invoice PDF generated at: ${pdfPath}`);
}
