const router = require('express').Router();
const userController = require('../../../controllers/UserController');
router
  .route('/')
  .get(userController.getUsers)
  .delete(userController.deleteUser);
router.route('/:id').get(userController.getUser);
//   .put(
//     '/:userId/profile-image',
//     uploadImage.single('image'), // our uploadImage middleware
//     (req, res, next) => {
//       /*
//            req.file = {
//              fieldname, originalname,
//              mimetype, size, bucket, key, location
//            }
//         */

//       // location key in req.file holds the s3 url for the image
//       let data = {};
//       if (req.file) {
//         data.image = req.file.location;
//       }

//       // HERE IS YOUR LOGIC TO UPDATE THE DATA IN DATABASE
//     }
//   );
module.exports = router;
