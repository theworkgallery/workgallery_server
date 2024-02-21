const order = require('../models/order.model');

async function createOrderConfirmation(orderConfirmation) {
    return await order.create(orderConfirmation);
}
