const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linkedInProfileSchema = new Schema(
  {
    description: {
      type: String,
      required: false,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
      trim: true,
    },
    education: [],
    experience: [],
    title: {
      type: String,
      required: false,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('linkedInProfile', linkedInProfileSchema);
