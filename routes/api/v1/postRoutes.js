const express = require('express');
const postsController = require('../../../controllers/postsController');
const Router = express.Router();
Router.get('/', postsController.getAllPosts);
Router.post('/', postsController.createPost);
module.exports = Router;
