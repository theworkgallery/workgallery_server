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
  name: {
    type: String,
  },
  readme: {
    type: String,
  },
  stars: {
    type: Number,
  },
  url: {
    type: String,
  },
  isGallery: {
    type: Boolean,
    default: false,
  },
});

const gitHubScrappingSchema = new Schema(
  {
    repos: [repoSchema],
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

module.exports = mongoose.model('githubProfile', gitHubScrappingSchema);
module.exports.repoSchema = repoSchema;
