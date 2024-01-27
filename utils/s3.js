const {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// const crypto = require('crypto');
// const fileName = crypto.randomBytes(20).toString('hex');
// console.log(fileName);

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

async function AwsUploadFile({ fileBuffer, fileName, mimeType, bucketName }) {
  const UploadParams = {
    Bucket: bucketName || BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };
  const fileLink = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
  const result = await S3_CLIENT.send(new PutObjectCommand(UploadParams));
  console.log(result, 'resultINuploadFun');
  console.log(fileLink);
  return { result, fileLink };
}

async function deletePost({ FileName, contentType, bucket_name }) {
  const deleteParams = {
    Bucket: bucket_name,
    Key: FileName,
  };

  return S3_CLIENT.send(new DeleteObjectCommand(deleteParams));
}

async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
  const command = new GetObjectCommand(params);
  const seconds = 60;
  const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

  return url;
}
module.exports = {
  createPresignedPost,
  deletePost,
  getObjectSignedUrl,
  AwsUploadFile,
};
