const collectionController = require('../../../controllers/collectionController');
const FileUpload = require('../../../middleware/post/fileUpload');
const router = require('express').Router();
const {
  AddRepoToCollection,
} = require('../../../controllers/WebscrapperController');
// Define routes
router.post('/', FileUpload, collectionController.createCollection);
router.put('/:collectionId', FileUpload, collectionController.updateCollection);

router.delete('/:collectionId', collectionController.deleteCollection);
router.get('/:collectionId', collectionController.getCollection);
// router.get(
//   '/users/:userId/collections',
//   collectionController.listCollectionsByUser
// );
//private collections
router.get('/users/collections', collectionController.listCollectionsByUser);

router.post(
  '/:collectionId/posts',
  FileUpload,
  collectionController.addPostToCollection
);
router.put('/:collectionId/github/:repoid', AddRepoToCollection);

router.delete(
  '/:collectionId/posts/:postId',
  collectionController.removePostFromCollection
);
router.get('/:collectionId/posts', collectionController.getPostsByCollection);
router.put(
  '/:collectionId/gallery',
  collectionController.AddCollectionToGallery
);
module.exports = router;
