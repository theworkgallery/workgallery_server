const orderService = require('../services/orderService');

async function handleOrder(req, res, next) {
  try {
    const userId = req.userId;
    console.info('Handling order for user: ' + userId);

    const reqBody = req.body;

    let orderDetails = await orderService.processOrder(reqBody);

    return res.status(201).json(orderDetails);
  } catch (err) {
    console.error(err);
    next(err);
  }
}

async function handlePayment(req, res, next) {
  try {
    const userId = req.userId;
    console.info('Handling payment for user: ' + userId);

    const reqBody = req.body;
    reqBody.userId = userId;

    let paymentDetails = await orderService.processPayment(reqBody);

    return res.status(201).json(paymentDetails);
  } catch (err) {
    console.error(err);
    next(err);
  }
}

async function handleConfirmation(req, res, next) {
  try {
    const userId = req.userId;
    console.info('Handling confirmation for user: ' + userId);

    const reqBody = req.body;

    let confirmationDetails = await orderService.processConfirmation(reqBody);

    return res.status(201).json(confirmationDetails);
  } catch (err) {
    console.error(err);
    next(err);
  }
}

module.exports = {
  handleOrder,
  handlePayment,
  handleConfirmation,
};
