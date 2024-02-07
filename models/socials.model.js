const mongoose = require('mongoose');

const socialsSchema = new mongoose.Schema({
  linkedin: {
    type: String,
    default: false,
  },
  github: {
    type: String,
    default: false,
  },
  medium: {
    type: String,
    default: false,
  },
  figma: {
    type: String,
    default: false,
  },
  behance: {
    type: String,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('SocialProfile', socialsSchema);
