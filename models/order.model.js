const mongoose = require('mongoose');

const orderModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        templateId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Template",
            required: true
        },
        orderId: {
            type: String,
            required: true
        },
        latestCharge: {
            type: String,
            required: true
        },
        paymentMethod: {
            type: String,
            required: true
        },
        amountReceived: {
            type: String,
            required: true
        },
        currency: {
            type: String,
            required: true
        }
    }, {
    timestamps: true
});

exports.default = mongoose.model('Orders', orderModel);