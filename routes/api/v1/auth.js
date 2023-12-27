const router = require('express').Router();
const authController = require('../../../controllers/authController');
const accessTokenController = require('../../../controllers/accessTokenController');
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
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
