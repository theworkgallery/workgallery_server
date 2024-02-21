const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const { AwsDeleteFile } = require('../utils/s3');
// const bucketName = process.env.AWS_BUCKET_NAME;
const TemplateSchema = new Schema(
  {
    templateHtml: String,
    Price: {
      type: Number,
      default: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    templateName: String,
    previewUrl: String,
    key: String,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TemplateSchema.pre('remove', async function (next) {
//   try {
//     if (this.fileUrl) {
//       await AwsDeleteFile({ FileName: this.key, bucket_name: bucketName });
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = mongoose.model('Template', TemplateSchema);
