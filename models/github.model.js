const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repoSchema = new Schema({
  description: {
    type: String,
    default: '',
  },
  forks: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
  },
  readme: {
    type: String,
  },
  stars: {
    type: Number,
  },
  sourceUrl: {
    type: String,
  },
  id: {
    type: Number,
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

const gitHubScrappingSchema = new Schema(
  {
    repos: [repoSchema],
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

module.exports = mongoose.model('githubProfile', gitHubScrappingSchema);
module.exports.repoSchema = repoSchema;
