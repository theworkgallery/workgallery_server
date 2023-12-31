const Post = require('../model/PostsModel');
const { createPresignedPost } = require('../utils/s3');

//keeping the file in memory
// function sanitizeFile(file, cb) {
//   // Define the allowed extension
//   const fileExts = ['.png', '.jpg', '.jpeg', '.gif'];

//   // Check allowed extensions
//   const isAllowedExt = fileExts.includes(
//     path.extname(file.originalname.toLowerCase())
//   );

//   // Mime type must be an image
//   const isAllowedMimeType = file.mimetype.startsWith('image/');

//   if (isAllowedExt && isAllowedMimeType) {
//     return cb(null, true); // no errors
//   } else {
//     // pass error msg to callback, which can be displaye in frontend
//     cb('Error: File type not allowed!');
//   }
// }

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.createPost = async (req, res) => {
  console.log(req.body);
  const userId = req?.user;
  try {
    let { key, content_type } = req.body;
    key = 'public' + key;
    console.log(key);

    const data = await createPresignedPost({ key, contentType: content_type });
    console.log(data);
    const post = await Post.create({ post: data?.fileLink, user: userId });
    console.log(post, 'Post');
    return res.send({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, image, video } = req.body;
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { content, image, video },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// module.exports = {
//   getAllPosts,
//   AddNewPost,
// };
