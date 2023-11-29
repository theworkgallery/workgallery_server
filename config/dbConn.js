const mongoose = require('mongoose');

mongoose.set('strictQuery', false)
const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
    } catch (err) {
        console.log(err)
    }
}

module.exports = dbConnection