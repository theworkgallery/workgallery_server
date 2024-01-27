const Post = require('../models/post.model');
async function getLobbyPosts(req, res) {
  try {
    const { userId } = req;

    const posts = await Post.aggregate([
      // Match posts based on criteria
      { $match: { isPrivate: true, user: mongoose.Types.ObjectId(userId) } },

      // Project fields (select only 'content' and 'fileUrl')
      { $project: { content: 1, fileUrl: 1 } },
    ]);

    if (posts && posts.length > 0) {
      return res.status(200).json(posts);
    } else {
      return res.status(404).json({ message: 'No posts found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Updates the post from user to be public
 * @route GET /users/following
 *
 * @param {string} req.postId - The ID of the of the post
 */

async function pushToGallery(req, res) {
  try {
    const { postId } = req.body;

    // Update the document using findByIdAndUpdate
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { isPrivate: true },
      { new: true } // This option returns the updated document
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(201).json({ message: 'Post updated', updatedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateLobbyPost(req, res) {
  const { content, postId } = req.body; // Assuming postId is passed in the request body
  const userId = req?.userId; // Assuming the user's ID is stored in req.user
  try {
    // Update the post and return the updated document
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { content: content },
      { new: true, runValidators: true } // options to return the updated document and run schema validators
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the post belongs to the user making the request (optional)
    if (updatedPost.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this post' });
    }

    return res.status(200).json({
      status: 'success',
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getLobbyPosts,
  pushToGallery,
  updateLobbyPost,
};
