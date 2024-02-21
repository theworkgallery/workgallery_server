const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userTemplateMap = new Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('userTemplateMap', userTemplateMap);
