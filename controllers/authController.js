const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const qs = require('qs');
const axios = require('axios');
const USER_REGEX = /^[a-z0-9-_]{5,23}$/;

const Token = require('../utils/TokenCreator');
const UserContext = require('../models/context.model');
const UserPreference = require('../models/preference.model');
const SuspiciousLogin = require('../models/suspiciousLogin.model');
const geoip = require('geoip-lite');
const { saveLogInfo } = require('../middleware/logger/logInfo');
const formatCreatedAt = require('../utils/timeConverter');

const types = {
  NO_CONTEXT_DATA: 'no_context_data',
  MATCH: 'match',
  BLOCKED: 'blocked',
  SUSPICIOUS: 'suspicious',
  ERROR: 'error',
};

const MESSAGE = {
  SIGN_IN_ATTEMPT: 'User attempting to sign in',
  SIGN_IN_ERROR: 'Error occurred while signing in user: ',
  INCORRECT_EMAIL: 'Incorrect email',
  INCORRECT_PASSWORD: 'Incorrect password',
  DEVICE_BLOCKED: 'Sign in attempt from blocked device',
  CONTEXT_DATA_VERIFY_ERROR: 'Context data verification failed',
  MULTIPLE_ATTEMPT_WITHOUT_VERIFY:
    'Multiple sign in attempts detected without verifying identity.',
  LOGOUT_SUCCESS: 'User has logged out successfully',
};

const getCurrentContextData = (req) => {
  const ip = req.clientIp || 'unknown';
  const location = geoip.lookup(ip) || 'unknown';
  const country = location.country ? location.country.toString() : 'unknown';
  const city = location.city ? location.city.toString() : 'unknown';
  const browser = req.useragent.browser
    ? `${req.useragent.browser} ${req.useragent.version}`
    : 'unknown';
  const platform = req.useragent.platform
    ? req.useragent.platform.toString()
    : 'unknown';
  const os = req.useragent.os ? req.useragent.os.toString() : 'unknown';
  const device = req.useragent.device
    ? req.useragent.device.toString()
    : 'unknown';

  const isMobile = req.useragent.isMobile || false;
  const isDesktop = req.useragent.isDesktop || false;
  const isTablet = req.useragent.isTablet || false;

  const deviceType = isMobile
    ? 'Mobile'
    : isDesktop
      ? 'Desktop'
      : isTablet
        ? 'Tablet'
        : 'unknown';

  return {
    ip,
    country,
    city,
    browser,
    platform,
    os,
    device,
    deviceType,
  };
};

const isTrustedDevice = (currentContextData, userContextData) =>
  Object.keys(userContextData).every(
    (key) => userContextData[key] === currentContextData[key]
  );

const isSuspiciousContextChanged = (oldContextData, newContextData) =>
  Object.keys(oldContextData).some(
    (key) => oldContextData[key] !== newContextData[key]
  );

const isOldDataMatched = (oldSuspiciousContextData, userContextData) =>
  Object.keys(oldSuspiciousContextData).every(
    (key) => oldSuspiciousContextData[key] === userContextData[key]
  );

const addNewSuspiciousLogin = async (_id, existingUser, currentContextData) => {
  const newSuspiciousLogin = new SuspiciousLogin({
    user: _id,
    email: existingUser.email,
    ip: currentContextData.ip,
    country: currentContextData.country,
    city: currentContextData.city,
    browser: currentContextData.browser,
    platform: currentContextData.platform,
    os: currentContextData.os,
    device: currentContextData.device,
    deviceType: currentContextData.deviceType,
  });
  return await newSuspiciousLogin.save();
};

const getOldSuspiciousContextData = (_id, currentContextData) =>
  SuspiciousLogin.findOne({
    user: _id,
    ip: currentContextData.ip,
    country: currentContextData.country,
    city: currentContextData.city,
    browser: currentContextData.browser,
    platform: currentContextData.platform,
    os: currentContextData.os,
    device: currentContextData.device,
    deviceType: currentContextData.deviceType,
  });

const checkUserNameAvailability = async (req, res, next) => {
  const userName = req.params.userName;
  try {
    if (USER_REGEX.test(userName)) {
      const result = await User.exists({ userName: userName }, { lean: true });
      if (!result) {
        return res
          .status(200)
          .json({ message: 'Username is available', availability: true });
      } else {
        return res
          .status(409)
          .json({ message: 'Username is not available', availability: false });
      }
    } else {
      res.json({ message: 'Username does not match the criteria' });
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
  const foundUser = await User.findOne({ email }).select('email').lean().exec();
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
  await saveLogInfo(
    req,
    'User attempting to sign in',
    LOG_TYPE.SIGN_IN,
    LEVEL.INFO
  );

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
      foundUser = await User.findOne({ email })
        .select('_id refreshToken email subscription password')
        .exec();
    } else {
      foundUser = await User.findOne({ userName })
        .select('_id refreshToken email subscription password')
        .exec();
    }

    console.log(foundUser);
    if (!foundUser) return res.status(404).json({ message: 'Invalid email' });
    //compare the password
    //TODO: Remove this after prod
    const result = await bcrypt.compare(password, foundUser.password);

    if (result) {
      const userId = foundUser._id.toString();
      const accessToken = Token.createAccessToken(
        userId,
        foundUser.subscription
      );
      const refreshToken = Token.createRefreshToken(userId);
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
        //picture: foundUser.picture,
        email: foundUser.email,
      });
    } else {
      await saveLogInfo(
        req,
        MESSAGE.INCORRECT_PASSWORD,
        LOG_TYPE.SIGN_IN,
        LEVEL.ERROR
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserInfo = async (req, res) => {
  const userId = req.userId;
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
    const accessToken = Token.createAccessToken(
      userId,
      user.subscription,
      '1m'
    );
    const refreshToken = Token.createRefreshToken(userId);
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
    const aT = Token.createAccessToken(userId, user.subscription, '1m');
    const refreshToken = Token.createRefreshToken(userId);
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

const verifyContextData = async (req, existingUser) => {
  try {
    const { _id } = existingUser;
    const userContextDataRes = await UserContext.findOne({ user: _id });

    if (!userContextDataRes) {
      return types.NO_CONTEXT_DATA;
    }

    const userContextData = {
      ip: userContextDataRes.ip,
      country: userContextDataRes.country,
      city: userContextDataRes.city,
      browser: userContextDataRes.browser,
      platform: userContextDataRes.platform,
      os: userContextDataRes.os,
      device: userContextDataRes.device,
      deviceType: userContextDataRes.deviceType,
    };

    const currentContextData = getCurrentContextData(req);

    if (isTrustedDevice(currentContextData, userContextData)) {
      return types.MATCH;
    }

    const oldSuspiciousContextData = await getOldSuspiciousContextData(
      _id,
      currentContextData
    );

    if (oldSuspiciousContextData) {
      if (oldSuspiciousContextData.isBlocked) return types.BLOCKED;
      if (oldSuspiciousContextData.isTrusted) return types.MATCH;
    }

    let newSuspiciousData = {};
    if (
      oldSuspiciousContextData &&
      isSuspiciousContextChanged(oldSuspiciousContextData, currentContextData)
    ) {
      const {
        ip: suspiciousIp,
        country: suspiciousCountry,
        city: suspiciousCity,
        browser: suspiciousBrowser,
        platform: suspiciousPlatform,
        os: suspiciousOs,
        device: suspiciousDevice,
        deviceType: suspiciousDeviceType,
      } = oldSuspiciousContextData;

      if (
        suspiciousIp !== currentContextData.ip ||
        suspiciousCountry !== currentContextData.country ||
        suspiciousCity !== currentContextData.city ||
        suspiciousBrowser !== currentContextData.browser ||
        suspiciousDevice !== currentContextData.device ||
        suspiciousDeviceType !== currentContextData.deviceType ||
        suspiciousPlatform !== currentContextData.platform ||
        suspiciousOs !== currentContextData.os
      ) {
        //  Suspicious login data found, but it doesn't match the current context data, so we add new suspicious login data
        const res = await addNewSuspiciousLogin(
          _id,
          existingUser,
          currentContextData
        );

        newSuspiciousData = {
          time: formatCreatedAt(res.createdAt),
          ip: res.ip,
          country: res.country,
          city: res.city,
          browser: res.browser,
          platform: res.platform,
          os: res.os,
          device: res.device,
          deviceType: res.deviceType,
        };
      } else {
        // increase the unverifiedAttempts count by 1
        await SuspiciousLogin.findByIdAndUpdate(
          oldSuspiciousContextData._id,
          {
            $inc: { unverifiedAttempts: 1 },
          },
          { new: true }
        );
        //  If the unverifiedAttempts count is greater than or equal to 3, then we block the user
        if (oldSuspiciousContextData.unverifiedAttempts >= 3) {
          await SuspiciousLogin.findByIdAndUpdate(
            oldSuspiciousContextData._id,
            {
              isBlocked: true,
              isTrusted: false,
            },
            { new: true }
          );

          await saveLogInfo(
            req,
            'Device blocked due to too many unverified login attempts',
            'sign in',
            'warn'
          );

          return types.BLOCKED;
        }

        // Suspicious login data found, and it matches the current context data, so we return "already_exists"
        return types.SUSPICIOUS;
      }
    } else if (
      oldSuspiciousContextData &&
      isOldDataMatched(oldSuspiciousContextData, currentContextData)
    ) {
      return types.MATCH;
    } else {
      //  No previous suspicious login data found, so we create a new one
      const res = await addNewSuspiciousLogin(
        _id,
        existingUser,
        currentContextData
      );

      newSuspiciousData = {
        time: formatCreatedAt(res.createdAt),
        id: res._id,
        ip: res.ip,
        country: res.country,
        city: res.city,
        browser: res.browser,
        platform: res.platform,
        os: res.os,
        device: res.device,
        deviceType: res.deviceType,
      };
    }

    const mismatchedProps = [];

    if (userContextData.ip !== newSuspiciousData.ip) {
      mismatchedProps.push('ip');
    }
    if (userContextData.browser !== newSuspiciousData.browser) {
      mismatchedProps.push('browser');
    }
    if (userContextData.device !== newSuspiciousData.device) {
      mismatchedProps.push('device');
    }
    if (userContextData.deviceType !== newSuspiciousData.deviceType) {
      mismatchedProps.push('deviceType');
    }
    if (userContextData.country !== newSuspiciousData.country) {
      mismatchedProps.push('country');
    }
    if (userContextData.city !== newSuspiciousData.city) {
      mismatchedProps.push('city');
    }

    if (mismatchedProps.length > 0) {
      return {
        mismatchedProps: mismatchedProps,
        currentContextData: newSuspiciousData,
      };
    }

    return types.MATCH;
  } catch (error) {
    return types.ERROR;
  }
};

const addContextData = async (req, res) => {
  const userId = req.userId;
  const email = req.email;
  const ip = req.ip || 'unknown';
  const location = geoip.lookup(ip) || 'unknown';
  const country = location.country ? location.country.toString() : 'unknown';
  const city = location.city ? location.city.toString() : 'unknown';
  const browser = req.useragent.browser
    ? `${req.useragent.browser} ${req.useragent.version}`
    : 'unknown';
  const platform = req.useragent.platform
    ? req.useragent.platform.toString()
    : 'unknown';
  const os = req.useragent.os ? req.useragent.os.toString() : 'unknown';
  const device = req.useragent.device
    ? req.useragent.device.toString()
    : 'unknown';

  const isMobile = req.useragent.isMobile || false;
  const isDesktop = req.useragent.isDesktop || false;
  const isTablet = req.useragent.isTablet || false;

  const deviceType = isMobile
    ? 'Mobile'
    : isDesktop
      ? 'Desktop'
      : isTablet
        ? 'Tablet'
        : 'unknown';

  const newUserContext = new UserContext({
    user: userId,
    email,
    ip,
    country,
    city,
    browser,
    platform,
    os,
    device,
    deviceType,
  });

  try {
    await newUserContext.save();
    res.status(200).json({
      message: 'Email verification process was successful',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route GET /auth/context-data/primary
 */
const getAuthContextData = async (req, res) => {
  try {
    const result = await UserContext.findOne({ user: req.userId });

    if (!result) {
      return res.status(404).json({ message: 'Not found' });
    }

    const userContextData = {
      firstAdded: formatCreatedAt(result.createdAt),
      ip: result.ip,
      country: result.country,
      city: result.city,
      browser: result.browser,
      platform: result.platform,
      os: result.os,
      device: result.device,
      deviceType: result.deviceType,
    };

    res.status(200).json(userContextData);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route GET /auth/context-data/trusted
 */
const getTrustedAuthContextData = async (req, res) => {
  try {
    const result = await SuspiciousLogin.find({
      user: req.userId,
      isTrusted: true,
      isBlocked: false,
    });

    const trustedAuthContextData = result.map((item) => {
      return {
        _id: item._id,
        time: formatCreatedAt(item.createdAt),
        ip: item.ip,
        country: item.country,
        city: item.city,
        browser: item.browser,
        platform: item.platform,
        os: item.os,
        device: item.device,
        deviceType: item.deviceType,
      };
    });

    res.status(200).json(trustedAuthContextData);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route GET /auth/context-data/blocked
 */
const getBlockedAuthContextData = async (req, res) => {
  try {
    const result = await SuspiciousLogin.find({
      user: req.userId,
      isBlocked: true,
      isTrusted: false,
    });

    const blockedAuthContextData = result.map((item) => {
      return {
        _id: item._id,
        time: formatCreatedAt(item.createdAt),
        ip: item.ip,
        country: item.country,
        city: item.city,
        browser: item.browser,
        platform: item.platform,
        os: item.os,
        device: item.device,
        deviceType: item.deviceType,
      };
    });

    res.status(200).json(blockedAuthContextData);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route GET /auth/user-preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const userPreferences = await UserPreference.findOne({ user: req.userId });

    if (!userPreferences) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.status(200).json(userPreferences);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route DELETE /auth/context-data/:contextId
 */
const deleteContextAuthData = async (req, res) => {
  try {
    const contextId = req.params.contextId;

    await SuspiciousLogin.deleteOne({ _id: contextId });

    res.status(200).json({
      message: 'Data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route PATCH /auth/context-data/block/:contextId
 */
const blockContextAuthData = async (req, res) => {
  try {
    const contextId = req.params.contextId;

    await SuspiciousLogin.findOneAndUpdate(
      { _id: contextId },
      { $set: { isBlocked: true, isTrusted: false } },
      { new: true }
    );

    res.status(200).json({
      message: 'Blocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @route PATCH /auth/context-data/unblock/:contextId
 */
const unblockContextAuthData = async (req, res) => {
  try {
    const contextId = req.params.contextId;

    await SuspiciousLogin.findOneAndUpdate(
      { _id: contextId },
      { $set: { isBlocked: false, isTrusted: true } },
      { new: true }
    );

    res.status(200).json({
      message: 'Unblocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
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
  addContextData,
  getAuthContextData,
  getTrustedAuthContextData,
  getUserPreferences,
  getBlockedAuthContextData,
  deleteContextAuthData,
  blockContextAuthData,
  unblockContextAuthData,
};
