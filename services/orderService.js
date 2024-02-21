const templateRepository = require('../repository/templateRepository');
const userRepository = require('../repository/userRepository');
const stripe = require("stripe")('sk_test_4eC39HqLyjWDarjtT1zdp7dc');

async function processOrder(orderRequest) {
    let response = {};

    /*Validate order request*/
    validateOrder(orderRequest);

    /*Get template details*/
    const template = await templateRepository.findTemplateById(orderRequest.templateId);
    
    if (template) {

        /*Get user details*/
        let userInfo = await userRepository.findUserById_ProjectStripeDetails(orderRequest.userId);

        if (!userInfo.stripeId) {
            console.info("Creating a new customer in stripe");

            /*Create customer in stripe and save the customer id in the user table*/
            let stripeCustomer = await stripe.customers.create({
                name: userInfo.firstName.concat(" ", userInfo.lastName),
                email: userInfo.email
            });

            console.info("Created stripe customer");
            console.info("Associating customer with the user");

            /*Update user table with stripe customer id*/
            await userRepository.updateUsersStripeId(orderRequest.userId, stripeCustomer.id);
        }

        response = {
            templateId: template._id,
            basePrice: template.basePrice,
            type: template.type
        };
    } else {
        /*TODO: Return error response */
        console.error("Template not found");
    }

    return response;
}

function validateOrder(orderRequest) {
    if (orderRequest.templateId) {
        /*TODO: Return error response */
        console.error("Template id is required");
    }
}

async function processPayment(paymentRequest) {
    /*Get user details*/
    let userInfo = await userRepository.findUserById_ProjectStripeDetailsAndEmail(paymentRequest.userId);

    if (!userInfo.stripeId) {
        /*TODO: Return error response */
        console.error("Stripe customer id not found");
    } else {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(paymentRequest),
            currency: "usd",
            customer: userInfo.stripeId,
            receipt_email: userInfo.email,
            automatic_payment_methods: {
                enabled: true,
            }
        });

        return {
            clientSecret: paymentIntent.client_secret,
        };
    }
}

function calculateOrderAmount(paymentRequest) {
    /*Read template*/

    /*Calculate total price*/
    /*Add tax price*/
    /*Add convineince fee*/
    return 100;
}

/*Request should contain the following fields*/
/*a) id
b) latest_charge //For refunds
c) payment_method
d) amount_received
e) currency*/
async function processConfirmation(confirmationRequest) {
    /*Associate templateid, transaction id with user*/
    /*Push order invoice to user*/ /*Should this be asynchronus ?*/
}

module.exports = {
    processOrder,
    processPayment,
    processConfirmation
};