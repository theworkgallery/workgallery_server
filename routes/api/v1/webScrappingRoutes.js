const Router = require('express').Router();

const webScrappingController = require('../../../controllers/WebscrapperController');
Router.get('/github/', webScrappingController.getGitHubData);
Router.get('/medium/', webScrappingController.getMediumData);
Router.get('/linkedin/', webScrappingController.getLinkedInData);

Router.post('/github', webScrappingController.updateGithubUserName);
Router.post('/medium', webScrappingController.updateMediumUserName);
Router.post('/linkedin', webScrappingController.updateLinkedInUserName);

module.exports = Router;
