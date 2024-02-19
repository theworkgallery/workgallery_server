const user = require('../models/user.model');

async function findUserById_ProjectStripeDetails(id) {
    return await user.findById(id).projection('_id','firstName','lastName','email','stripeId');
}

async function findUserById_ProjectStripeDetailsAndEmail(id) {
    return await user.findById(id).projection('_id','stripeId','email');
}
async function updateUsersStripeId(id, stripeId) {
    return await user.findByIdAndUpdate(id, { stripeId: stripeId });
}

module.exports = {
    findUserById_ProjectStripeDetails,
    updateUsersStripeId,
    findUserById_ProjectStripeDetailsAndEmail
}