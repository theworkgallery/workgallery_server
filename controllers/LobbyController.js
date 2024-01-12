const Gallery = require('../model/galleryModel');
const { createPresignedPost, deletePost } = require('../utils/s3');
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function getLobbyPosts(req, res) {
  const posts = await Gallery.find({ isPrivate: true }).select('-isPrivate');
  if (posts) {
    return res.status(200).json(posts);
  }
  return res.status(404).json({ message: 'No posts found ' });
}

async function pushToGallery(req, res) {
  const { postId } = req.body;
  console.log(postId);
  const post = await Gallery.findById(postId).exec();
  if (!post) return res.status(404).json({ message: 'post not found ' });
  post.isPrivate = true;
  await post.save();
  return res.status(201).json({ message: 'post updated' });
}

async function deleteLobbyPost(req, res) {
  const userId = req?.user;
  const { id } = req.params;
  console.log(id);
  const post = await Gallery.findById(id).lean().exec();
  if (post.user !== userId)
    //check if another user is trying to delete post
    return res.status(403).json({ message: 'Forbidden' });
  if (!id) return res.status(400).json({ message: 'post not found' });
  const result = await deletePost({ key: post.key, bucket_name: BUCKET_NAME });
  await Gallery.findByIdAndDelete(id);
  return res.status(204).json({ message: 'post deleted' });
}

async function updateLobbyPost(req, res) {
  const { id, key, content_type } = req.body;
  try {
    const post = await Gallery.findById(id);
    const userId = req?.user;
    key = 'public' + key;
    console.log(key);
    await deletePost({ key: post.key, bucket_name: BUCKET_NAME });
    const data = await createPresignedPost({ key, contentType: content_type });
    const Newpost = await Gallery.create({
      post: data?.fileLink,
      user: userId,
      key: key,
    });
    console.log(post, 'Post');
    return res.send({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

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

const createNewPost = async (req, res, next) => {
  console.log(req.body);
  const userId = req?.user;
  try {
    let { key, content_type } = req.body;
    key = 'public' + key;
    console.log(key, 'Key');
    const data = await createPresignedPost({ key, contentType: content_type });
    console.log(data, 'Post Data from Create Presigned post');
    const post = await Gallery.create({
      post: data?.fileLink,
      user: userId,
      key: key,
    });
    console.log(post, 'Post');
    return res.send({
      status: 'success',
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  getLobbyPosts,
  pushToGallery,
  updateLobbyPost,
  deleteLobbyPost,
  createNewPost,
};
