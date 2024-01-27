const router = require('express').Router();
const useragent = require('express-useragent');
const verifyJwt = require('../../../middleware/verifyJwt');
const {
  addContextData,
  getAuthContextData,
  getTrustedAuthContextData,
  getUserPreferences,
  getBlockedAuthContextData,
  deleteContextAuthData,
  blockContextAuthData,
  unblockContextAuthData,
} = require('../../../controllers/authController');

const {
  verifyEmailValidation,
  verifyEmail,
} = require('../middleware/users/verifyEmail');

const {
  verifyLoginValidation,
  verifyLogin,
  blockLogin,
} = require('../../../middleware/users/verifyLogin');

router.get('/context-data/primary', verifyJwt, getAuthContextData);
router.get('/context-data/trusted', verifyJwt, getTrustedAuthContextData);
router.get('/context-data/blocked', verifyJwt, getBlockedAuthContextData);
router.get('/user-preferences', verifyJwt, getUserPreferences);
router.delete('/context-data/:contextId', verifyJwt, deleteContextAuthData);

router.patch('/context-data/block/:contextId', verifyJwt, blockContextAuthData);
router.patch(
  '/context-data/unblock/:contextId',
  verifyJwt,
  unblockContextAuthData
);

router.use(useragent.express());

router.get('/verify', verifyEmailValidation, verifyEmail, addContextData);
router.get('/verify-login', verifyLoginValidation, verifyLogin);
router.get('/block-login', verifyLoginValidation, blockLogin);

module.exports = router;
