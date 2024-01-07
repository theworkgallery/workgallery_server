const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const waitListSchema = new Schema({
  email: {
    type: String,
    required: false,
    trim: true,
  },
});

module.exports = mongoose.model('waitlistUser', waitListSchema);
