const mongoose = require('mongoose');

const socialsSchema = new mongoose.Schema({
  linkedInUserName: {
    type: String,
    default: false,
  },
  githubUserName: {
    type: String,
    default: false,
  },
  mediumUserName: {
    type: String,
    default: false,
  },
  figmaUserName: {
    type: String,
    default: false,
  },
  behanceUserName: {
    type: String,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('SocialProfile', tokenSchema);
