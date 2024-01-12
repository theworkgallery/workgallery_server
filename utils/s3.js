const {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const S3_CLIENT = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;

async function createPresignedPost({ key, contentType }) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  console.log('key', key);
  const fileLink = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  const signedUrl = await getSignedUrl(S3_CLIENT, command, {
    expiresIn: 5 * 60, // 5 minutes - default is 15 mins
  });
  return { fileLink, signedUrl };
}
async function deletePost({ key, contentType, bucket_name }) {
  const deleteParams = {
    Bucket: bucket_name,
    Key: key,
  };

  return S3_CLIENT.send(new DeleteObjectCommand(deleteParams));
}
module.exports = {
  createPresignedPost,
  deletePost,
};
