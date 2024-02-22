const user = require('../models/user.model');

async function findUserById_ProjectStripeDetails(id) {
    return await user.findById(id);
}

async function updateUsersStripeId(id, stripeId) {
    return await user.findByIdAndUpdate(id, { stripeId: stripeId });
}

module.exports = {
    findUserById_ProjectStripeDetails,
    updateUsersStripeId
}