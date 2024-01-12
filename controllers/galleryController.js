const Gallery = require('../model/galleryModel');
const { createPresignedPost, deletePost } = require('../utils/s3');
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
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

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Gallery.findById(postId).exec();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await deletePost({ key: post.key, bucket_name: BUCKET_NAME });
    await Gallery.findByIdAndDelete(postId).exec();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Gallery.find({ isPrivate: false }).lean().exec();
    res.status(200).json(posts);
    if (!posts.length) {
      return res.status(404).json({ message: 'No posts found' });
    }
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
    const post = await Gallery.create({
      post: data?.fileLink,
      user: userId,
      key: key,
      isPrivate: false,
    });
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
    const { content_type } = req.body;
    const post = await Gallery.findById(postId).exec();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    // await deletePost({ key: post.key, bucket_name: BUCKET_NAME });
    const data = await createPresignedPost({
      key: post.key,
      contentType: content_type,
    });
    post.post = data?.fileLink;

    // const updatedPost = await Post.findByIdAndUpdate(
    //   postId,
    //   { content, image, video },
    //   { new: true }
    // );

    res.status(200).json({ postData: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// module.exports = {
//   getAllPosts,
//   AddNewPost,
// };
