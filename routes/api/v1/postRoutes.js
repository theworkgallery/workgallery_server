const FileUpload = require('../../../middleware/post/fileUpload');
const router = require('express').Router();

const {
  getPublicPosts,
  getHomeFeed,
  getPost,
  createPost,
  confirmPost,
  rejectPost,
  deletePostInMongo,
  getCommunityPosts,
  getFollowingUsersPosts,
  likePost,
  unlikePost,
  addComment,
  savePost,
  unsavePost,
  getSavedPosts,
  clearPendingPosts,
  updatePost,
  getUserPosts,
} = require('../../../controllers/postController');
const {
  postValidator,
  commentValidator,
  validatorHandler,
} = require('../../../middleware/post/userInputValidator');

const {
  createPostLimiter,
  likeSaveLimiter,
  commentLimiter,
} = require('../../../middleware/limiter/limiter');

//Next version
// const analyzeContent = require('../../services/analyzeContent');
// const processPost = require('../../../services/processPost');
const fileUpload = require('../../../middleware/post/fileUpload');

// router.get('/community/:communityId', getCommunityPosts);
router.get('/saved', getSavedPosts);
router.get('/:publicUserId/userPosts', getPublicPosts);
router.get('/:id/following', getFollowingUsersPosts);

router.get('/:id', getPost);
router.get('/posts', getUserPosts);
router.get('/', getHomeFeed);

// router.delete('/pending', clearPendingPosts);

router.use(likeSaveLimiter);

// router.patch('/:id/save', savePost);
// router.patch('/:id/unsave', unsavePost);
// router.patch('/:id/like', likePost);
// router.patch('/:id/unlike', unlikePost);

//delete any post
router.delete('/:id', deletePostInMongo);

//TODO:for communities
// router.post('/confirm/:confirmationToken', confirmPost);
// router.post('/reject/:confirmationToken', rejectPost);

// router.post(
//   '/:id/comment',
//   commentLimiter,
//   commentValidator,
//   validatorHandler,
//   analyzeContent,
//   addComment
// );

router.post(
  '/',
  createPostLimiter,
  fileUpload,
  // postValidator,
  // validatorHandler,
  // analyzeContent,
  // processPost,
  // postConfirmation,
  createPost
);

router.put('/posts/:postId', updatePost);

module.exports = router;

// Router.post('/new', FileUpload, (req, res) => {
//   console.log(req.file);
//   console.log(req.fileType);
//   console.log(req.fileUrl);
//   res.send('Hello World!');
// });
