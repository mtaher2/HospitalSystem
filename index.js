import express from 'express';
import { selectUser } from './models/patientModel';  // Adjust the path if needed
import path from 'path';
import { fileURLToPath } from 'url';

// Use fileURLToPath to get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to select a user by User_ID
console.log(getPatients());
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});