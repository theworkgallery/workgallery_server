const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MediumScrappingSchema = new Schema(
  {
    posts: [],
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

module.exports = mongoose.model('mediumScrappedDB', MediumScrappingSchema);
