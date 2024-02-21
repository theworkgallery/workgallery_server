const mongoose = require('mongoose');
const { repoSchema } = require('./github.model');
const { postSchema } = require('./medium.model');

const gallerySchema = new mongoose.Schema({
  repos: [repoSchema],
  mediumPosts: [postSchema],
});

module.exports = mongoose.model('gallery', gallerySchema);
