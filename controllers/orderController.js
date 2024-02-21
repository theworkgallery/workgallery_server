const orderService = require("../services/orderService");

async function handleOrder(req, res){
    const userId = req.userId;
    console.info("Handling order for user: " + userId);

    const reqBody = req.body;

    let orderDetails = await orderService.processOrder(reqBody);

    return res.status(201).json(orderDetails);
}

async function handlePayment(req,res){
    const userId = req.userId;
    console.info("Handling payment for user: " + userId);

    const reqBody = req.body;

    let paymentDetails = await orderService.processPayment(reqBody);

    return res.status(201).json(paymentDetails);
}

async function handleConfirmation(req,res){
    const userId = req.userId;
    console.info("Handling confirmation for user: " + userId);

    const reqBody = req.body;

    let confirmationDetails = await orderService.processConfirmation(reqBody);

    return res.status(201).json(confirmationDetails);
}

module.exports = {
    handleOrder,
    handlePayment,
    handleConfirmation
};