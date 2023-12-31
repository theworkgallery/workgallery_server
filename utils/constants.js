const REFRESH_TOKEN_TTL = '7d';
const SES_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

module.exports = {
  REFRESH_TOKEN_TTL,
  SES_CONFIG,
};
