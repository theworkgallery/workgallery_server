const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = new Schema(
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

module.exports = mongoose.model('post', postSchema);
