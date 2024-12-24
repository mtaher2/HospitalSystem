function checkAuthenticated(allowedRoles = []) {
    if (!Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
    }
    return (req, res, next) => {
        if (req.session.user) {
            const userRole = req.session.user.Role;
            if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
                return next();
            } else {
                return res.redirect('/'); 
            }
        } else {
            return res.redirect('/');
        }
    };
}

export default checkAuthenticated;
