const bcrypt = require('bcrypt');
const User = require('../model/UserModel');
const jwt = require('jsonwebtoken');
const subRoles = require('../config/roles_list');

const checkUserNameAvailability = async (req, res, next) => {
  const userName = req.params.userName;
  try {
    const result = await User.exists({ userName: userName }, { lean: true });
    console.log(result);
    if (!result) {
      return res
        .status(200)
        .json({ message: 'Username is available', availability: true });
    } else {
      return res
        .status(409)
        .json({ message: 'Username is not available', availability: false });
    }
  } catch (err) {
    console.log(err);
    next();
  }
};

const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;
  console.log(userName, email, password);
  //check if the user already exists
  if (!userName || !email || !password)
    return res.status(400).json({ message: 'Provide all the fields' });
  const foundUser = await User.findOne({ email }).lean().exec();
  console.log(foundUser, 'Found user');
  if (foundUser) {
    return res.status(409).json({ message: 'user already exists' });
  } //conflict
  try {
    const user = await User.create({
      userName,
      email,
      password,
    });
    await user.save();
    if (user) {
      const { _id, email, username } = user;
      return res.status(201).json({
        status: 'success',
        data: {
          _id,
          email,
          username,
        },
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
    throw new Error(err.message);
  }
};

const loginUser = async (req, res) => {
  const { email, userName, password } = req.body;

  //check if the user already exists
  console.log(email);
  console.log(userName);
  console.log(!email, !userName);

  try {
    if (!email && !userName) {
      return res.status(400).json({ message: 'enter email or username' });
    }
    if (!password) return res.status(400).json({ message: 'enter password' });
    let foundUser;
    if (email) {
      foundUser = await User.findOne({ email }).exec();
    } else {
      foundUser = await User.findOne({ userName }).exec();
    }

    console.log(foundUser);
    if (!foundUser) return res.status(404).json({ message: 'Invalid email' });
    //compare the password
    //TODO: Remove this after prod
    const result = await bcrypt.compare(password, foundUser.password);

    if (result) {
      const accessToken = jwt.sign(
        {
          userInfo: {
            id: foundUser?._id.toString(),
            subscription: subRoles[`${foundUser.subscription}`],
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '5m' }
      );

      const refreshToken = jwt.sign(
        {
          userInfo: {
            id: foundUser?._id.toString(),
          },
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
      );

      //save the refresh token in Db
      foundUser.refreshToken = refreshToken;
      //send refresh token as a cookie
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: 'true',
      });
      await foundUser.save();
      return res.status(200).json({
        accessToken,
        id: foundUser._id.toString(),
        username: foundUser.userName,
        email: foundUser.email,
      });
    } else {
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const activateAccount = async (req, res) => {
  const token = req.query.token;
  try {
    const foundUser = await User.findOne({ activationToken: token }).exec();
    console.log(foundUser);

    if (!foundUser) {
      return res.status(404).json({ message: 'Invalid activation token.' });
    }
    foundUser.isActivated = true;
    foundUser.activationToken = null;
    const updatedUser = await foundUser.save();
    console.log(updatedUser);
    if (updatedUser.isActivated) {
      return res
        .status(200)
        .json({ message: 'Your account has been activated' });
    } else {
      return res
        .status(403)
        .json({ message: 'Something went wrong please try again later' });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: 'Something went wrong please try again later' });
  }
};

const verifyRefreshToken = async (req, res) => {
  //extract cookies
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies.jwt) return res.sendStatus(401);
  const refreshToken = cookies?.jwt;
  //find user by refresh token
  const foundUser = await User.findOne({ refreshToken });
  if (!foundUser) return res.sendStatus(401);
  //verify the refresh token
  try {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        console.log(decoded);
        if (err || foundUser._id.toString() !== decoded.userInfo.id)
          return res.sendStatus(403);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              id: decoded.userInfo.id,
              subscription: subRoles[`${foundUser.subscription}`],
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '5m' }
        );
        return res.json(accessToken);
      }
    );
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: 'something went wrong on our side' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  activateAccount,
  verifyRefreshToken,
  checkUserNameAvailability,
};
