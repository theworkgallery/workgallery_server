const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CollectionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isGallery: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
      minLength: 4,
    },
    description: {
      type: String,
      default: '',
    },

    fileUrl: {
      type: String,
      default: '',
    },
    addedData: [],
    key: String,
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserCollection', CollectionSchema);
