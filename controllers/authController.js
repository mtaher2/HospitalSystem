import { selectUserByNationalID } from "../models/userModel.js";
import { updateUserPasswordPlainText } from "../models/userModel.js";

const roleRouteMapping = {
  patient: "/patient-profile",
  receptionist: "/reception-add-patient",
  doctor: "/doctor-dashboard",
};

function handleRoleBasedRedirection(user, req, res) {
  const roleName = user.Role_Name.toLowerCase(); // Get the role name from the user object

  if (roleRouteMapping[roleName]) {
    //user in the roleRouteMapping object to redirect to the correct route
    req.session.user = user;
    return res.redirect(roleRouteMapping[roleName]);
  } else {
    // If the role is not found in the mapping, redirect to the root route
    return res.redirect("/");
  }
}

async function login(req, res) {
  const { "national-id": nationalID, password } = req.body;

  try {
    // Fetch user by National ID
    const user = await selectUserByNationalID(nationalID);

    if (user.length === 0) {
      // User not found
      return res.render("login", {
        errorMessage: "National ID or password is incorrect.",
        stylesheetName: "styles",
        headerTitle: "Galala Hospital System",
      });
    }

    // Check if the password matches (plain text comparison)
    if (user[0].Password === password) {
      // Store the user object in session
      req.session.user = user[0]; // Save the entire user object to the session

      // Parse Created_At and Updated_At for comparison
      const createdAt = new Date(user[0].Created_At);
      const updatedAt = new Date(user[0].Updated_At);

      // If Created_At == Updated_At, redirect to the update password page
      if (createdAt.getTime() === updatedAt.getTime()) {
        return res.redirect("/update-password"); // Redirect to update password page
      }

      // Otherwise, proceed with role-based redirection
      return handleRoleBasedRedirection(user[0], req, res); // Use the dynamic route based on role
    } else {
      return res.render("login", {
        errorMessage: "National ID or password is incorrect.",
        stylesheetName: "styles",
        headerTitle: "Galala Hospital System",
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.render("login", {
      errorMessage: "An error occurred. Please try again.",
      stylesheetName: "styles",
      headerTitle: "Galala Hospital System",
    });
  }
}

async function handleUpdatePassword(req, res) {
  console.log("test 1", req.session.user.National_ID);
  const nationalID = req.session.user.National_ID; // Assuming the user is logged in and their National ID is stored in the session
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.render("login/updatePassword", {
      errorMessage: "New password and confirmation do not match",
    });
  }

  try {
    const result = await updateUserPasswordPlainText(
      nationalID,
      oldPassword,
      newPassword
    );

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction failed:", err);
      }

      // Redirect to login page with alert message and type
      return res.redirect(
        "/?alertMessage=Password%20Updated%20Successfully..&alertType=success"
      );
    });
  } catch (err) {
    res.render("login/updatePassword", {
      errorMessage: err.message,
    });
  }
}

export { login, handleUpdatePassword };
