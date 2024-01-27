const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const gitHubScrappingSchema = new Schema(
  {
    repos: [],

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
