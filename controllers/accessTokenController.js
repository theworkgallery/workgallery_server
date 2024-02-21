const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const subRoles = require('../config/roles_list');
const utils = require('../utils/TokenCreator');
const verifyAccessTokenCookie = async (req, res) => {
  //extract cookies
  const cookies = req?.cookies;
  console.log(cookies, 'Cookies');
  if (!cookies?.aT)
    return res
      .status(401)
      .json({ error: 'Unauthorized access token not found' });

  const accessToken = cookies?.aT;
  console.log(accessToken, 'Access token');
  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    async (err, decoded) => {
      console.log(decoded, 'Decoded access token');
      //TODO:Remove in production
      if (err?.name == 'TokenExpiredError')
        return res.status(403).json({ error: 'Forbidden token expired' });
      if (err) {
        console.log('User is not matched');
        return res.sendStatus(403);
      }
      console.log(decoded, 'decoded user token');
      const foundUser = await User.findById(decoded.id)
        .select('_id userName email')
        .lean()
        .exec();
      console.log(foundUser, 'Found user');
      if (!foundUser) return res.sendStatus(403);
      const userId = foundUser._id.toString();
      const accessToken = utils.createAccessToken(
        userId,
        foundUser.subscription
      );

      //sending authorization

      return res.status(200).json({
        accessToken,
        id: userId,
        userName: foundUser.userName,
        email: foundUser.email,
        // picture: foundUser.picture,
      });
    }
  );
};

module.exports = verifyAccessTokenCookie;
