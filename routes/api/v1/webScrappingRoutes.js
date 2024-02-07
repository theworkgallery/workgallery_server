const Router = require('express').Router();

const webScrappingController = require('../../../controllers/WebscrapperController');
Router.get('/github/', webScrappingController.getGitHubData);
Router.get('/medium/', webScrappingController.getMediumData);
Router.get('/linkedin/', webScrappingController.getLinkedInData);
Router.post('/new', webScrappingController.AddSocialPlatforms);
Router.get('/', webScrappingController.getAllSocialProfiles);
Router.post('/github', webScrappingController.updateGithubUserName);
Router.post('/medium', webScrappingController.updateMediumUserName);
Router.post('/linkedin', webScrappingController.updateLinkedInUserName);
Router.get('/github/:id', webScrappingController.getSingleRepositoryData);
Router.get('/medium/:id', webScrappingController.getSingleMediumPostData);
module.exports = Router;
