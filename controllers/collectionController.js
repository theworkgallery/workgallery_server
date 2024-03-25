const UserCollection = require('../models/collection.model');
const { generateFileName } = require('../utils/functions');
const { AwsUploadFile, AwsDeleteFile } = require('../utils/s3');
const sharp = require('sharp');
const Post = require('../models/post.model');

const mongoose = require('mongoose');
const uploadImage = async ({ type, file }) => {
  if (!file || type !== 'image') {
    return { fileLink: '', fileNameWithKey: '', error: null }; // Early return for non-image types or missing file
  }
  try {
    const getFileName = generateFileName(file.mimetype);
    const fileNameWithKey = 'public/images/' + getFileName;
    // file.buffer = await sharp(file.buffer)
    //   .resize({ height: 350, width: 350, fit: 'contain' })
    //   .toBuffer();
    const { fileLink } = await AwsUploadFile({
      fileBuffer: file.buffer,
      fileName: fileNameWithKey,
      mimeType: type,
    });
    return { fileLink, fileNameWithKey, error: null };
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Failed to upload image:', error);

    // Handle specific errors here if necessary
    // For example, if (error instanceof SpecificError) { ... }

    // Return a specific error message or object to indicate failure
    return {
      fileLink: '',
      fileNameWithKey: '',
      error: 'Failed to upload image. Please try again later.',
    };
  }
};

const createCollection = async (req, res, next) => {
  const user = new mongoose.Types.ObjectId(req?.userId);
  const { description, title } = req.body;
  if (!description || !title)
    return res
      .status(400)
      .json({ message: 'Title and description are required' });
  try {
    const file = req?.files[0] || null;
    const type = file?.mimetype?.split('/')[0] || null;
    console.log(file);
    const { fileLink, fileNameWithKey, error } = await uploadImage({
      type,
      file,
    });

    const newCollection = new UserCollection({
      title,
      description,
      fileUrl: fileLink,
      key: fileNameWithKey,
      user, // Assuming this is the ID of the user creating the collection
    });
    const UpdatedCollection = await newCollection.save();
    return res.status(201).json(UpdatedCollection);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateCollection = async (req, res, next) => {
  const { collectionId } = req.params; // Assuming you're passing the collection ID in the URL
  const { title, description } = req.body;
  const file = req.files[0];
  const type = file?.mimetype?.split('/')[0];
  try {
    const { fileLink, fileNameWithKey, error } = await uploadImage({
      type,
      file,
    });

    const updatedCollection = await UserCollection.findByIdAndUpdate(
      collectionId,
      { $set: { title, description, fileUrl: fileLink, key: fileNameWithKey } },
      { new: true } // This option returns the document after update
    );

    if (!updatedCollection) {
      throw new Error('Collection not found');
    }
    res.json(updatedCollection);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  try {
    const deletedCollection =
      await UserCollection.findByIdAndDelete(collectionId);

    if (!deletedCollection) {
      throw new Error('collection not found it may have already deleted');
    }

    await AwsDeleteFile({
      FileName: deletedCollection.key,
    });

    res.status(200).json({ message: 'Collection successfully deleted' });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  try {
    const collections = await UserCollection.findById(collectionId)
      .populate('posts')
      .lean()
      .select('addedData title description fileUrl')
      .exec();
    console.log(collections);

    if (!collections)
      return res.status(404).json({ message: 'collection not found' });

    return res.status(200).json(collections);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const listCollectionsByUser = async (req, res, next) => {
  const { userId } = req.params;
  // Assuming you're passing the user ID in the URL
  let user = userId || req.userId;
  try {
    const collections = await UserCollection.find({ user: user })
      .select('fileUrl title description isGallery')
      .lean()
      .exec();
    console.log(collections);

    res.json(collections);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const addPostToCollection = async (req, res, next) => {
  const { collectionId } = req.params; // Collection ID from URL
  const { content = 'This is a editable content' } = req.body;
  const uploadResponses = [];
  try {
    for (const file of req.files) {
      const getFileName = generateFileName(file.mimetype);
      const fileNameWithKey = file.mimetype.startsWith('video/')
        ? 'public/videos/' + getFileName
        : 'public/images/' + getFileName;

      // if (file.mimetype.startsWith('image/')) {
      //   // file.buffer = await sharp(file.buffer)
      //   //   .resize({ height: 600, width: 500, fit: 'contain' })
      //   //   .toBuffer();
      // }

      const { fileLink } = await AwsUploadFile({
        fileBuffer: file.buffer,
        fileName: fileNameWithKey,
        mimeType: file.type,
      });
      // const postId = savedPost._id;

      // const post = await Post.findById(postId)
      //   .populate('user', 'firstName lastName avatar')
      //   .lean();
      // post.createdAt = dayjs(post.createdAt).fromNow();

      //   uploadResponses.push({
      //     name: getFileName,
      //     url: fileLink,
      //     type,
      //   });

      const newPost = new Post({
        user: userId,
        content,
        fileUrl: fileLink,
        key: fileNameWithKey,
        collection: collectionId,
      });
      const savedPost = await newPost.save();

      // Optionally, add the post ID to the collection's posts array
      await UserCollection.findByIdAndUpdate(collectionId, {
        $push: { posts: savedPost._id },
      });
    }

    res.status(201).json({ message: 'Added to the collection' });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const removePostFromCollection = async (req, res) => {
  //just remove the post from collection

  const { postId, collectionId } = req.params; // Assuming you pass both IDs
  try {
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      req.statusCode(404);
      throw new Error('Post not found');
    }
    // Optionally, remove the post ID from the collection's posts array
    await UserCollection.findByIdAndUpdate(collectionId, {
      $pull: { posts: postId },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getPostsByCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  console.log('im here');
  try {
    const collectionWithPosts =
      await UserCollection.findById(collectionId).populate('posts');
    console.log(collectionWithPosts);

    if (!collectionWithPosts) {
      req.statusCode = 404;
      throw new Error('Collection not found');
    }

    console.log(dataArr, 'dataArr');
    return res.status(200).json(collectionWithPosts);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const AddCollectionToGallery = async (req, res, next) => {
  //add collection to gallery
  const { collectionId } = req.params;
  try {
    const foundCollection = await UserCollection.findById(collectionId)
      .select('isGallery')
      .exec();
    console.log(foundCollection);
    if (!foundCollection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    foundCollection.isGallery = !foundCollection.isGallery;
    const UpdatedCollection = await foundCollection.save();
    return res.status(200).json(UpdatedCollection);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollection,
  listCollectionsByUser,
  addPostToCollection,
  removePostFromCollection,
  getPostsByCollection,
  uploadImage,
  AddCollectionToGallery,
};
