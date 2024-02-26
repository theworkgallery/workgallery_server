const User = require('../../models/user.model');
const ROLES_LIST = require('../../config/roles_list');
const AddRolesToRequest = async (req, res, next) => {
  const userId = req.userId;
  const foundUser = await User.findById(userId).lean().select('role').exec();
  console.log(foundUser);
  if (!foundUser) return res.status(401).json({ error: 'User not found' });
  req.roles = [ROLES_LIST[foundUser.role]];
  next();
};

module.exports = {
  AddRolesToRequest,
};
