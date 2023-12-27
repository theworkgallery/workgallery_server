const User = require('../model/UserModel');
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -activationToken')
      .lean()
      .exec();
    res.status(200).json({ users });
  } catch (err) {
    console.log(err);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.id;
  try {
    const user = await User.findOneAndDelete({ _id: id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getUsers,
  deleteUser,
};
