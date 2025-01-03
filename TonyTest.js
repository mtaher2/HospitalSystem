import { handleLeaveRequest } from "./models/TonyNazieh.js";
const result = await handleLeaveRequest(1, 'Approve', 'Approved for medical reasons');

console.log(result);

