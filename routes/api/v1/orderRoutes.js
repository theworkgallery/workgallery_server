const orderController = require('../../../controllers/orderController');
const Router = require('express').Router();

Router.post('/',orderController.handleOrder);
Router.post('/payment',orderController.handlePayment);
Router.post('/confirm',orderController.handleConfirmation);


module.exports = Router;