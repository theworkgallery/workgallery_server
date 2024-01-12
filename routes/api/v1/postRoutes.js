const express = require('express');
const postsController = require('../../../controllers/galleryController');
const Router = express.Router();
Router.get('/', postsController.getAllPosts);
Router.post('/', postsController.createPost);
module.exports = Router;
