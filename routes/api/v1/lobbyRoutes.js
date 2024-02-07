const lobbyController = require('../../../controllers/LobbyController');
const { createPost } = require('../../../controllers/postController');
const Router = require('express').Router();

Router.get('/', lobbyController.getLobbyPosts)
  .put('/', lobbyController.updateLobbyPost)
  // .delete('/:id', lobbyController.deleteLobbyPost)
  .post('/', createPost);
Router.get('/git', lobbyController.getGitHubRepos);
Router.patch('/update/:id', lobbyController.pushToGallery);
module.exports = Router;
