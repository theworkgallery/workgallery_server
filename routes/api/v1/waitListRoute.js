const Router = require('express').Router();
const WaitList = require('../../../model/WaitList');
Router.post('/waitlist', async (req, res) => {
  const { email } = req.body;
  console.log(email);
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await WaitList.findOne({ email: email }).exec();
  console.log(user);
  if (!user) {
    const newUser = new WaitList({ email });
    const user = await newUser.save();
    return res.status(200).json({ message: 'User added to waitlist' });
  }
  return res.status(409).json({ message: 'User already exists' });
});
module.exports = Router;
