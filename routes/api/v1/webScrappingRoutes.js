const Router = require('express').Router();
const fileUpload = require('../../../middleware/post/fileUpload');
const webScrappingController = require('../../../controllers/WebscrapperController');
Router.put(
  '/update/github/:id',
  fileUpload,
  webScrappingController.UpdateGitRepo
);
Router.get('/github/', webScrappingController.getGitHubData);
Router.get('/medium/', webScrappingController.getMediumData);
Router.get('/linkedin/', webScrappingController.getLinkedInData);
Router.post('/new', webScrappingController.AddSocialPlatforms);
Router.get('/', webScrappingController.getAllSocialProfiles);
Router.post('/github', webScrappingController.updateGithubUserName);
Router.post('/medium', webScrappingController.updateMediumUserName);
Router.post('/linkedin', webScrappingController.updateLinkedInUserName);
Router.get(
  '/single/github/:id',
  webScrappingController.getSingleRepositoryData
);
Router.get(
  '/single/medium/:id',
  webScrappingController.getSingleMediumPostData
);

Router.put('/github/:id', webScrappingController.addGitRepoToGallery);
module.exports = Router;
