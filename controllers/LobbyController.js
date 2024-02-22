const Post = require('../models/post.model');
const mongoose = require('mongoose');
const GitHub = require('../models/github.model');
const Medium = require('../models/medium.model');
const Collection = require('../models/collection.model');
const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const UserCollection = require('../models/collection.model');
const { generateFileName } = require('../utils/functions');
const { AwsUploadFile } = require('../utils/s3');
const sharp = require('sharp');
async function getLobbyPosts(req, res) {
  console.log('im here');
  try {
    const { userId } = req;
    const posts = await Post.aggregate([
      // Match posts based on criteria
      {
        $match: { isPrivate: true, user: new mongoose.Types.ObjectId(userId) },
      },
      // Project fields (select only 'content' and 'fileUrl')
      { $project: { content: 1, fileUrl: 1, _id: 0 } },
    ]);

    const mediumPosts = await Medium.aggregate([
      // Match posts based on criteria
      {
        $match: {
          isPrivate: true,
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      // Project fields (select only 'content' and 'fileUrl')
      { $project: { posts: 1, _id: 0 } },
    ]);

    console.log(mediumPosts);

    if (posts && posts.length > 0) {
      return res.status(200).json(posts);
    } else {
      return res.status(404).json({ message: 'No posts found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getGitHubRepos(req, res, next) {
  const userId = req.userId;
  try {
    const GitHubRepos = await GitHub.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: {
          filteredRepos: {
            $filter: {
              input: '$repos',
              as: 'repo',
              cond: { $eq: ['$$repo.isGallery', true] },
            },
          },
          // You can include other fields here if needed
        },
      },
      {
        $unwind: '$filteredRepos',
      },
      {
        $replaceRoot: { newRoot: '$filteredRepos' },
      },
    ]);
    return res.status(200).json(GitHubRepos);
  } catch (err) {
    console.log(err);
    next();
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
      { isPrivate: false },
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

// async function CreateNewCollection(req, res, next) {
//   const userId = req.userId;
//   const { title, description } = req.body;
//   const file = req.files[0];
//   const type = file?.mimetype?.split('/')[0];

//   try {
//     if (file && type == 'image') {
//       const getFileName = generateFileName(file.mimetype);
//       const fileNameWithKey = 'public/images/' + getFileName;
//       // file.buffer = await sharp(file.buffer)
//       //   .resize({ height: 350, width: 350, fit: 'contain' })
//       //   .toBuffer();
//       const { fileLink } = await AwsUploadFile({
//         fileBuffer: file.buffer,
//         fileName: fileNameWithKey,
//         mimeType: type,
//       });
//       if (!FoundUser) throw new Error('User not found');
//       FoundUser.avatar.fileUrl = fileLink;
//       FoundUser.avatar.edited = true;
//     }
//     const foundCollection = Collection.findOne({ user: userId }).exec();
//     if (foundCollection) {
//       foundCollection.collections.unshift({
//         title,
//         description,
//         'coverImage.fileUrl': coverImage,
//         'coverImage.key': key,
//       });
//     }
//     const newCollection = await Collection.create({
//       user: userId,
//     });
//     newCollection.collections.unshift({
//       title,
//       description,
//       'coverImage.fileUrl': coverImage,
//       'coverImage.key': key,
//     });
//     return res.status(201).json(newCollection);
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// }

// async function AddToCollection(req, res, next) {
//   const userId = req.userId;
//   const { collectionId, postId } = req.body;
//   try {
//     const collection = await Collection.findOneAndUpdate(
//       { _id: collectionId, user: userId },
//       { $push: { posts: postId } },
//       { new: true }
//     );
//     if (!collection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }
//     return res.status(200).json(collection);
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// }

// async function addToRepoToGallery(req, res) {
//   const { id } = req.params;
//   const userId = req?.userId;
//   try {

//     const Repo= await GitHub.

//     if (!updatedRepo) {
//       return res.status(404).json({ message: 'Repo not found' });
//     }

//     return res.status(200).json({
//       status: 'success',
//       data: updatedRepo,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }

module.exports = {
  getLobbyPosts,
  pushToGallery,
  updateLobbyPost,
  getGitHubRepos,
};
