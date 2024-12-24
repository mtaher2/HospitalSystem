import {getPaidBillsByPatientId, getUnpaidBillsByPatientId} from "../models/billingModle.js";


export async function showPatientBills(req, res) {
  const patientId = req.session.user.User_ID; 
  const activeTab = req.tab;  

  try {
    let bills;
    if (activeTab === 'unpayed') {
      bills = await getUnpaidBillsByPatientId(patientId);
    } else if (activeTab === 'payed') {
      bills = await getPaidBillsByPatientId(patientId);
    }

    res.render('patient/patientBills', {
      tab: activeTab,
      bills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).send('An error occurred while fetching the bills.');
  }
}

