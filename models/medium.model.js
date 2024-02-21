const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = new Schema({
  description: {
    type: String,
    default: '',
  },
  title: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  tags: [],
  sourceUrl: {
    type: String,
  },
  isGallery: {
    type: Boolean,
    default: false,
  },
  editedData: {
    title: String,
    description: String,
    fileUrl: String,
    isModified: {
      type: Boolean,
      default: false,
    },
  },
});
const MediumScrappingSchema = new Schema(
  {
    posts: [postSchema],
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

module.exports = mongoose.model('mediumProfile', MediumScrappingSchema);
module.exports.postSchema = postSchema;
