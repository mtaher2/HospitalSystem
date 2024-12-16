import { selectUserByNationalID } from '../models/userModel.js';

const roleRouteMapping = {
    'patient': '/patient-profile',
    'receptionist': '/reception-add-patient',
    'doctor': '/doctor-dashboard',
};

function handleRoleBasedRedirection(user, req, res) {
    const roleName = user.Role_Name.toLowerCase(); // Get the role name from the user object

    if (roleRouteMapping[roleName]) {
       //user in the roleRouteMapping object to redirect to the correct route
        req.session.user = user;  
        return res.redirect(roleRouteMapping[roleName]);
    } else {
        // If the role is not found in the mapping, redirect to the root route
        return res.redirect('/'); 
    }
}

async function login(req, res) {
    const { 'national-id': nationalID, password } = req.body;

    try {
        // Fetch user by National ID
        const user = await selectUserByNationalID(nationalID);

        if (user.length === 0) {
            // User not found
            return res.render('login', { 
                errorMessage: 'National ID or password is incorrect.',
                stylesheetName: 'styles',
                headerTitle: 'Galala Hospital System',
            });
        }

        // Check if the password matches (plain text comparison)
        if (user[0].Password === password) {
            // Handle role-based redirection
            return handleRoleBasedRedirection(user[0], req, res);  // Use the dynamic route based on role
        } else {
            console.log("Password is incorrect.");
            return res.render('login', { 
                errorMessage: 'National ID or password is incorrect.',
                stylesheetName: 'styles',
                headerTitle: 'Galala Hospital System',
            });
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.render('login', {
            errorMessage: 'An error occurred. Please try again.',
            stylesheetName: 'styles',
            headerTitle: 'Galala Hospital System',
        });
    }
}

export { login };

