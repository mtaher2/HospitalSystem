function checkAuthenticated(allowedRoles = []) {
    // Ensure allowedRoles is always an array
    if (!Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
    }
    console.log('Allowed roles:', allowedRoles);
    return (req, res, next) => {
        if (req.session.user) {
            const userRole = req.session.user.Role; // Assuming `role` is stored in the session
            console.log('User role:', userRole);
            if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
                return next(); // User is authenticated and role matches, proceed
            } else {
                return res.redirect('/'); // Role does not match
            }
        } else {
            return res.redirect('/'); // User is not authenticated, redirect to login
        }
    };
}

export default checkAuthenticated;
