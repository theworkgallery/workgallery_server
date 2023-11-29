const verifyRoles = async (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.roles) return res.sendStatus(401);
        const rolesArr = [...allowedRoles]
        const userRoles = req.roles
        const result = userRoles.map((role) => rolesArr.includes(role)).find((val) => val === true);
        if (!result) return res.sendStatus(401);
        next();
    }
}