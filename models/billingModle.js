
async function getPendingBills() {
    const connection = await db.getConnection();
    try {
        const sql = 'SELECT * FROM Bill WHERE Payment_Status = "Pending"';
        const [rows] = await connection.query(sql);
        return rows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function processPayment(billingId, paymentMethod) {
    const connection = await db.getConnection();
    try {
        const updateSql = 'UPDATE Bill SET Payment_Status = "Paid", Payment_Method = ? WHERE Billing_ID = ?';
        const [result] = await connection.query(updateSql, [paymentMethod, billingId]);
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

async function verifyInsuranceCoverage(insuranceId, amount) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const sql = 'SELECT Coverage_Details FROM Insurance WHERE Insurance_ID = ?';
        const [rows] = await connection.query(sql, [insuranceId]);

        if (rows.length === 0) {
            throw new Error('Insurance record not found');
        }

        const coverageDetails = JSON.parse(rows[0].Coverage_Details);
        const coveragePercentage = parseFloat(coverageDetails.percentage);

        if (isNaN(coveragePercentage)) {
            throw new Error('Invalid coverage details');
        }
        const coveredAmount = (coveragePercentage / 100) * amount;
        const remainingAmount = amount - coveredAmount;

        await connection.commit();
        return { coveredAmount, remainingAmount };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
async function generateBillingSummary(billingId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Fetch Billing Details from the Billing table
        const sqlBilling = `
            SELECT Billing_ID, Invoice_Date, Payment_Status, Patient_ID, Insurance_ID, Amount
            FROM Billing
            WHERE Billing_ID = ?
        `;
        const [billingDetails] = await connection.query(sqlBilling, [billingId]);

        if (billingDetails.length === 0) {
            throw new Error('No billing information found for the given Billing ID');
        }

        const bill = billingDetails[0];

        // Fetch Patient Information
        const sqlPatient = `
            SELECT Patient_ID, FName, LName, Phone
            FROM Patient
            WHERE Patient_ID = ?
        `;
        const [patientDetails] = await connection.query(sqlPatient, [bill.Patient_ID]);

        if (patientDetails.length === 0) {
            throw new Error('No patient information found for the given Patient ID');
        }

        const patient = patientDetails[0];

        // Start the Invoice Text
        let invoiceText = `===================== INVOICE =====================\n`;
        invoiceText += `Billing ID: ${bill.Billing_ID}\n`;
        invoiceText += `Invoice Date: ${bill.Invoice_Date}\n`;
        invoiceText += `Payment Status: ${bill.Payment_Status}\n\n`;

        // Patient Details
        invoiceText += `Patient Details:\n`;
        invoiceText += `Name: ${patient.FName} ${patient.LName}\n`;
        invoiceText += `Phone: ${patient.Phone}\n\n`;

        // Services Provided Section
        invoiceText += `Services Provided:\n`;
        invoiceText += `-----------------------------------------------------\n`;

        let totalAmount = bill.Amount; // Start with the initial amount

        // Fetch Appointment Services
        const sqlAppointments = `
            SELECT Appointment_ID, Patient_ID, Doctor_ID, Appointment_Date
            FROM Appointment
            WHERE Billing_ID = ?
        `;
        const [appointments] = await connection.query(sqlAppointments, [billingId]);

        if (appointments.length > 0) {
            appointments.forEach(appointment => {
                invoiceText += `Appointment ID: ${appointment.Appointment_ID}, Date: ${appointment.Appointment_Date}, Doctor ID: ${appointment.Doctor_ID}\n`;
                invoiceText += `Price: $${totalAmount}\n`;
                invoiceText += `-----------------------------------------------------\n`;
            });
        }

        // Fetch Pharmacy Services
        const sqlPrescription = `
            SELECT Prescription_ID, Medication_Name, Dosage, Frequency
            FROM Prescription
            WHERE Billing_ID = ?
        `;
        const [prescriptions] = await connection.query(sqlPrescription, [billingId]);

        if (prescriptions.length > 0) {
            prescriptions.forEach(item => {
                invoiceText += `Medication: ${item.Medication_Name}, Dosage: ${item.Dosage}, Frequency: ${item.Frequency}\n`;
                invoiceText += `Price: $${totalAmount}\n`;
                invoiceText += `-----------------------------------------------------\n`;
            });
        }

        // Fetch Lab Order Services
        const sqlLabOrders = `
            SELECT Lab_Order_ID, Lab_ID
            FROM Lab_Order
            WHERE Billing_ID = ?
        `;
        const [labOrders] = await connection.query(sqlLabOrders, [billingId]);

        if (labOrders.length > 0) {
            for (const lab of labOrders) {
                // Fetch Lab Name from the Lab table
                const sqlLabName = `
                    SELECT Lab_Name
                    FROM Lab
                    WHERE Lab_ID = ?
                `;
                const [labTest] = await connection.query(sqlLabName, [lab.Lab_ID]);

                if (labTest.length > 0) {
                    const labName = labTest[0].Lab_Name;
                    invoiceText += `Lab Item: ${labName}\n`;
                    invoiceText += `Price: $${totalAmount}\n`;
                    invoiceText += `-----------------------------------------------------\n`;
                }
            }
        }

        // Fetch Radiology Order Services
        const sqlRadiologyOrders = `
            SELECT Radiology_Order_ID, Radiology_ID
            FROM Radiology_Order
            WHERE Billing_ID = ?
        `;
        const [radiologyOrders] = await connection.query(sqlRadiologyOrders, [billingId]);

        if (radiologyOrders.length > 0) {
            for (const radiology of radiologyOrders) {
                // Fetch Scan Name from the Radiology table
                const sqlScanName = `
                    SELECT Scan_Name
                    FROM Radiology
                    WHERE Radiology_ID = ?
                `;
                const [scan] = await connection.query(sqlScanName, [radiology.Radiology_ID]);

                if (scan.length > 0) {
                    const scanName = scan[0].Scan_Name;
                    invoiceText += `Radiology Item: ${scanName}\n`;
                    invoiceText += `Price: $${totalAmount}\n`;
                    invoiceText += `-----------------------------------------------------\n`;
                }
            }
        }

        // Fetch Insurance Information and Apply Coverage
        const insuranceId = Billing.Insurance_ID; 
        const { coveredAmount, remainingAmount } = await verifyInsuranceCoverage(insuranceId, totalAmount);
        // Add the Total Amount
        if(coveredAmount>0){
            invoiceText += `Insurance Coverage:\n`;
            invoiceText += `Covered Amount: $${coveredAmount.toFixed(2)}\n`;
            invoiceText += `Remaining Amount: $${remainingAmount.toFixed(2)}\n`;
        }else{
            invoiceText += `Total Amount: $${totalAmount.toFixed(2)}\n`;
        }
        invoiceText += `====================================================\n\n`;

        // Closing Message
        invoiceText += `Thank you for choosing our services. Please feel free to contact us for any questions.\n`;

        await connection.commit();
        return invoiceText;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};


export {getPendingBills, processPayment, verifyInsuranceCoverage, generateBillingSummary};