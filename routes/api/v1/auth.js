const router = require('express').Router();
const authController = require('../../../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get(
  '/check-username/:userName',
  authController.checkUserNameAvailability
);
router.get(`/activate-account`, authController.activateAccount);
router.get('/refresh', authController.verifyRefreshToken);
module.exports = router;
