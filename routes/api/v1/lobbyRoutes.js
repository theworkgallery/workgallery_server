const lobbyController = require('../../../controllers/LobbyController');
const Router = require('express').Router();
Router.get('/', lobbyController.getLobbyPosts)
  .put('/', lobbyController.updateLobbyPost)
  .delete('/:id', lobbyController.deleteLobbyPost)
  .post('/', lobbyController.createNewPost);
Router.patch('/update/:id', lobbyController.pushToGallery);
module.exports = Router;
