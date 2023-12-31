const bcrypt = require('bcrypt');
const User = require('../model/UserModel');
const qs = require('qs');
const axios = require('axios');
const USER_REGEX = /^[a-z0-9-_]{5,23}$/;
const { FilterQuery } = require('mongoose');
const utils = require('../utils/utils');
const checkUserNameAvailability = async (req, res, next) => {
  const userName = req.params.userName;
  try {
    const result = await User.exists({ userName: userName }, { lean: true });
    console.log(result);
    if (!result && USER_REGEX.test(userName)) {
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
  console.log(email, 'Email');
  console.log(userName, 'username');

  console.log(password, 'password');
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
      const userId = foundUser._id.toString();
      const accessToken = utils.createAccessToken(
        userId,
        foundUser.subscription
      );
      const refreshToken = utils.createRefreshToken(userId);
      //save the refresh token in Db
      foundUser.refreshToken = refreshToken;
      //send refresh token as a cookie

      const result = await foundUser.save();
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
      });

      //TODO: secure: true, add this in pro
      //sending authorzation
      res.json({
        accessToken,
        id: userId,
        userName: foundUser.userName,
        picture: foundUser.picture,
        email: foundUser.email,
      });
    } else {
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserInfo = async (req, res) => {
  const userId = req.user;
  const foundUser = await User.findById(userId).lean().exec();
  if (!foundUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  console.log(foundUser, 'Found User');
  console.log(id);
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
async function logoutUser(req, res) {
  // On client, also delete the accessToken

  const cookies = req?.cookies;
  console.log('Cookies found while logging out', cookies);
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies?.jwt;

  // Is refreshToken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  foundUser.refreshToken = '';
  const result = await foundUser.save();
  console.log(result);

  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.sendStatus(204);
}

async function getGoogleOAuthTokens({ code }) {
  const url = `https://oauth2.googleapis.com/token`;
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    grant_type: 'authorization_code',
  };
  try {
    const response = await axios.post(url, qs.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log(response.data, 'google response');
    return response.data;
  } catch (err) {
    console.log(err.response.data.error, 'google response');
    console.log(err, 'Failed to fetch google data');
  }
}

async function getGitHubOAuthTokens({ code }) {
  const url = 'https://github.com/login/oauth/access_token';
  const values = {
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code,
  };
  try {
    const response = await axios.post(url, values, {
      headers: { accept: 'application/json' },
    });
    return response.data;
  } catch (err) {
    console.log(err.response.data.error, 'github response');
    console.log(err, 'Failed to fetch Github data');
  }
}

async function findAndUpdateUser(query, update, options) {
  return User.findOneAndUpdate(query, update, options);
}

async function getGoogleUserData({ id_token, access_token }) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.log(err.response.data.error, 'google response');
  }
}

async function getGitHubData({ access_token }) {
  // Use the access token to fetch user data from GitHub
  try {
    const githubUser = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return githubUser.data;
  } catch (err) {
    console.log(err.response.data.error, 'github response');
  }
}

const googleLogin = async (req, res) => {
  //get the code from qs

  const code = req.query.code;
  try {
    const response = await getGoogleOAuthTokens({ code });

    //get the id and accessToken with the code
    const id_token = response?.id_token;

    const access_token = response?.access_token;
    if (!id_token || !access_token) {
      console.log('No id token or access token');
      return res.redirect('http://localhost:5173/oauth/google');
    }
    //get user with tokens
    const googleUser = await getGoogleUserData({ id_token, access_token });
    //jwt.decode(data?.id_token);
    console.log(googleUser);
    if (!googleUser.verified_email) {
      return res
        .status(403)
        .json({ message: 'Google account is not verified email address' });
    }
    //upsert the user
    const user = await findAndUpdateUser(
      {
        email: googleUser.email,
      },
      {
        email: googleUser.email,
        userName: googleUser.name,
        picture: googleUser.picture,
        isActivated: true,
      },
      { upsert: true, new: true }
    );
    console.log(user, 'Created user');
    //create a session
    //create token
    //create access and refresh token
    const userId = user._id.toString();
    const accessToken = utils.createAccessToken(
      userId,
      user.subscription,
      '1m'
    );
    const refreshToken = utils.createRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();
    //set cookie and redirect back to client
    res.cookie('aT', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 1 * 60 * 1000,
    });
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });

    //TODO: secure: true, add this in pro

    res.redirect('http://localhost:5173/oauth/authorization');
  } catch (err) {
    console.error(err);
    res.redirect('http://localhost:5173/oauth/google');
  }
};
const githubLogin = async (req, res) => {
  const code = req.query.code;
  console.log(code, 'Code');
  try {
    // Exchange code for an access token

    const data = await getGitHubOAuthTokens({ code });
    console.log(data);
    const accessToken = data?.access_token;

    if (!accessToken) {
      return res.redirect('http://localhost:5173/oauth/github');
    }

    const gitHubUser = await getGitHubData({ access_token: accessToken });
    console.log(gitHubUser);
    const [firstName, lastName] = gitHubUser.name.split(' ');
    console.log(firstName, lastName);
    const email = gitHubUser.email ? gitHubUser.email : gitHubUser.login;
    if (!gitHubUser) return res.redirect('http://localhost:5173');
    const user = await findAndUpdateUser(
      {
        userName: gitHubUser.login,
      },
      {
        email: email,
        userName: gitHubUser.login,
        picture: gitHubUser.avatar_url,
        firstName: firstName,
        lastName: lastName,
        isActivated: true,
      },
      { upsert: true, new: true }
    );
    console.log(user, 'Created user');
    // Implement user upsert and token creation logic here
    // ...

    //create a session
    //create token
    //create access and refresh token
    const userId = user._id.toString();
    const aT = utils.createAccessToken(userId, user.subscription, '1m');
    const refreshToken = utils.createRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();
    //set cookie and redirect back to client
    res.cookie('aT', aT, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 1 * 60 * 1000,
    });
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });

    //TODO: secure: true, add this in pro

    res.redirect('http://localhost:5173/oauth/authorization');
  } catch (err) {
    console.error(err);
    res.redirect('http://localhost:5173/oauth/github');
  }
};

module.exports = {
  registerUser,
  loginUser,
  activateAccount,
  checkUserNameAvailability,
  logoutUser,
  googleLogin,
  githubLogin,
  getUserInfo,
};
