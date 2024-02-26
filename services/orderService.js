const templateRepository = require('../repository/templateRepository');
const userRepository = require('../repository/userRepository');
const stripe = require("stripe")(process.env.VITE_STRIPE_SECRET_KEY);

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

async function processPayment(paymentRequest) {
    /*Get user details*/
    let userInfo = await userRepository.findUserById_ProjectStripeDetails(paymentRequest.userId);
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
        await userRepository.updateUsersStripeId(paymentRequest.userId, stripeCustomer.id);
    } 

    const template = await templateRepository.findTemplateById(paymentRequest.templateId);

    validatePayment(paymentRequest);
    let orderAmount = calculateOrderAmount(template);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(template),
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

function calculateOrderAmount(template) {
    if (template) {
        /*Calculate total price*/
        /*Add tax price*/
        /*Add convineince fee*/
        return template.Price * 100;
    }else{
        console.error("Template not found");
    }
}

function validatePayment(orderRequest) {
    if (!orderRequest.templateId) {
        /*TODO: Return error response */
        console.error("Template id is required");
    }
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