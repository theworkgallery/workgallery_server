const verifyRefreshToken = require('../../../controllers/refreshTokenController');
const router = require('express').Router();
router.get('/refresh', verifyRefreshToken);
module.exports = router;
