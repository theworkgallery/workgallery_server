const mongoose = require('mongoose');

const templatesModel = new mongoose.Schema(
{
    basePrice: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true
    }
},
{ 
    timestamps: true 
});

module.exports = mongoose.model('Templates', templatesModel);