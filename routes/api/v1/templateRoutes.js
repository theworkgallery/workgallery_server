const Router = require('express').Router();
const ROLES_LIST = require('../../../config/roles_list');
const {
  AddRolesToRequest,
} = require('../../../middleware/users/AddRoleTORequest');
const verifyRoles = require('../../../middleware/verifyRoles');
const FIleUpload = require('../../../middleware/post/fileUpload');
const TemplateController = require('../../../controllers/TemplateController');
Router.get('/', TemplateController.getAllTemplates);
Router.get('/user', TemplateController.getAllGalleryData);
// Assuming Router is an instance of express.Router()
Router.post(
  '/',
  AddRolesToRequest,
  verifyRoles(ROLES_LIST.admin),
  FIleUpload,
  TemplateController.createTemplate
);

Router.post('/addtogallery', TemplateController.addToGallery);
Router.get('/status/:target', TemplateController.getTemplateStatusOfUser);
Router.get('/gallery', TemplateController.getAllTemplatesOfUser);
Router.get('/:id', TemplateController.getTemplateById);

module.exports = Router;
