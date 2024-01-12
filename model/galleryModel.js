const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const gallerySchema = new Schema(
  {
    content: {
      type: String,
      required: false,
      trim: true,
    },
    post: {
      type: String,
      trim: true,
    },
    key: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('gallery', gallerySchema);
