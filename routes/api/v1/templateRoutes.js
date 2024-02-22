const Router = require('express').Router();
const TemplateController = require('../../../controllers/TemplateController');
Router.get('/', TemplateController.getAllTemplates);
Router.get('/user', TemplateController.getAllGalleryData);
Router.post('/', TemplateController.AddTemplate);
Router.get('/:id', TemplateController.getTemplateById);
module.exports = Router;
