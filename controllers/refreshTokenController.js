const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const subRoles = require('../config/roles_list');
const verifyRefreshToken = async (req, res) => {
  //extract cookies
  console.log('Im here');
  const cookies = req?.cookies;
  console.log(cookies, 'Cookies');
  if (!cookies?.jwt)
    return res
      .status(401)
      .json({ error: 'Unauthorized Refresh token not found' });
  const refreshToken = cookies?.jwt;
  console.log(refreshToken);
  const foundUser = await User.findOne({ refreshToken })
    .select('_id role userName email subscription')
    .lean()
    .exec();
  console.log('Found User', foundUser);
  if (!foundUser) return res.sendStatus(403);
  //verify the refresh token
  console.log(foundUser, 'Found user');
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      console.log(decoded, 'Decoded refresh token');
      //TODO:Remove in production
      if (err?.name == 'TokenExpiredError')
        return res.status(403).json({ error: 'Forbidden token expired' });
      if (err || foundUser._id.toString() !== decoded.id) {
        console.log('User is not matched');
        return res.sendStatus(403);
      }
      console.log(decoded, 'decoded user token');
      console.log(err);
      const accessToken = jwt.sign(
        {
          id: foundUser._id.toString(),
          role: subRoles[`${foundUser.subscription}`],
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );
      return res.status(200).json({
        accessToken,
        email: foundUser.email,
        userName: foundUser.userName,
      });
    }
  );
};

module.exports = verifyRefreshToken;
