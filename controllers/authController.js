import { selectUserByNationalID } from "../models/userModel.js";
import { updateUserPasswordPlainText } from "../models/userModel.js";

const roleRouteMapping = {
  patient: "/patient-profile",
  receptionist: "/patient-profile-reception",
  doctor: "/doctor-appointment",
  pharmacist: "/pharmacy-home-page",
};

function handleRoleBasedRedirection(user, req, res) {
  const roleName = user.Role_Name.toLowerCase();

  if (roleRouteMapping[roleName]) {
    req.session.user = user;
    return res.redirect(roleRouteMapping[roleName]);
  } else {
    return res.redirect("/");
  }
}

export async function login(req, res) {
  const { "national-id": nationalID, password } = req.body;

  try {
    
    const user = await selectUserByNationalID(nationalID);
    if (user.length === 0) {
      return res.render("login", {
        errorMessage: "National ID or password is incorrect.",
        stylesheetName: "styles",
        headerTitle: "Galala Hospital System",
      });
    }

    if (user[0].Password === password) {
      req.session.user = user[0];
      const createdAt = new Date(user[0].Created_At);
      const updatedAt = new Date(user[0].Updated_At);

      if (createdAt.getTime() === updatedAt.getTime()) {
        return res.redirect("/update-password");
      }
      return handleRoleBasedRedirection(user[0], req, res);
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

export async function handleUpdatePassword(req, res) {
  console.log("test 1", req.session.user.National_ID);
  const nationalID = req.session.user.National_ID;
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

