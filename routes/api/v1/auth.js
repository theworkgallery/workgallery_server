const router = require('express').Router();
const useragent = require('express-useragent');
const requestIp = require('request-ip');
const { signUpSignInLimiter } = require('../../../middleware/limiter/limiter');

const {
  sendVerificationEmail,
} = require('../../../middleware/users/verifyEmail');

const {
  sendLoginVerificationEmail,
} = require('../../../middleware/users/verifyLogin');

const authController = require('../../../controllers/authController');
const accessTokenController = require('../../../controllers/accessTokenController');

router.post(
  '/register',
  signUpSignInLimiter,
  sendVerificationEmail,
  authController.registerUser
);
router.post(
  '/login',
  signUpSignInLimiter,
  requestIp.mw(),
  useragent.express(),
  sendLoginVerificationEmail,
  authController.loginUser
);
router.get('/logout', authController.logoutUser);
router.get(
  '/check-username/:userName',
  authController.checkUserNameAvailability
);

router.get('/oauth/userInfo', accessTokenController);

router.get('/oauth/github', authController.githubLogin);
router.get('/oauth/google', authController.googleLogin);
router.get(`/activate-account`, authController.activateAccount);

module.exports = router;
