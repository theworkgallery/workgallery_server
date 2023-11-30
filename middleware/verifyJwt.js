const jwt = require('jsonwebtoken');

const verifyJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];

  // const decoded = {
  //   userInfo: { id: '6568557514886b68457b8eda', subscription: 2300 },
  //   iat: 1701348038,
  //   exp: 1701348338,
  // };

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(err);
    if (err) return res.sendStatus(403); //forbidden
    req.role = decoded.userInfo.subscription;
    req.id = decoded.userInfo.id;
    next();
  });
};

module.exports = verifyJwt;
