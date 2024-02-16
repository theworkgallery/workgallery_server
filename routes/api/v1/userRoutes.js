const router = require('express').Router();
const userController = require('../../../controllers/UserController');
router
  .route('/')
  .get(userController.getUsers)
  .delete(userController.deleteUser);
module.exports = router;
