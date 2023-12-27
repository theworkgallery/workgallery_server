//create accessToken
const jwt = require('jsonwebtoken');
const subRoles = require('../config/roles_list');

function createAccessToken(userId, subscription, ttl = '15m') {
  return jwt.sign(
    {
      id: userId,
      role: subRoles[`${subscription}`],
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ttl }
  );
}

function createRefreshToken(userId) {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  createAccessToken,
  createRefreshToken,
};
