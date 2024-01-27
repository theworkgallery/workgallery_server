const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

const Gallery = require('../models/post.model');
const User = require('../models/user.model');

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

const getAllPosts = async (req, res) => {
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

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const { fileType, fileUrl, fileKey } = req;

    const post = await Gallery.findById(postId)
      .select('content fileUrl key')
      .exec();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (content) post.content = content;
    if (fileUrl) post.fileUrl = fileUrl;
    if (fileType) post.fileType = fileType;
    if (fileKey) post.key = fileKey;

    await post.save();

    res.status(200).json({ postData: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPosts,
  updatePost,
};
