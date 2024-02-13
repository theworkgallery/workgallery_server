const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { AwsDeleteFile } = require('../utils/s3');
const bucketName = process.env.AWS_BUCKET_NAME;
const postSchema = new Schema(
  {
    content: {
      type: String,
      required: false,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: false,
    },
    key: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    collections: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCollection',
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
postSchema.index({ content: 'text' });
postSchema.index({ user: 1, isPrivate: -1 });

//automatically delete file from s3 when post is deleted

//ERROR:Works with remove method only

postSchema.pre('remove', async function (next) {
  try {
    if (this.fileUrl) {
      await AwsDeleteFile({ FileName: this.key, bucket_name: bucketName });
    }

    // await this.model('Comment').deleteMany({ _id: this.comments });

    // await this.model('Report').deleteOne({
    //   post: this._id,
    // });

    await this.model('User').updateMany(
      {
        savedPosts: this._id,
      },
      {
        $pull: {
          savedPosts: this._id,
        },
      }
    );
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Post', postSchema);
