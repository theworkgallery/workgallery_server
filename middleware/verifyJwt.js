const jwt = require("jsonwebtoken")

const verifyJwt = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];
    jwt.verify(token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.sendStatus(403); //forbidden
            req.roles = decoded.UserInfo.roles;
            req.email = decoded.email;
            next();
        }
    )
}

module.exports = verifyJwt