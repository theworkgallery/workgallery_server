const Router = require('express').Router();
const galleryController = require('../../../controllers/galleryController');
Router.get('/', galleryController.getAllPosts);
Router.put('/', galleryController.updatePost);
// .delete('/', galleryController.deletePost)
// .post('/', galleryController.createPost);
module.exports = Router;
