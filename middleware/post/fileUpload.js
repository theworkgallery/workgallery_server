const multer = require('multer');
const storage = multer.memoryStorage();
const crypto = require('crypto');
const sharp = require('sharp');
const { AwsUploadFile } = require('../../utils/s3');

const generateFileName = (mimeType, bytes = 32) => {
  const extension = mimeType.split('/')[1]; // Extracts file extension from MIME type
  return crypto.randomBytes(bytes).toString('hex') + '.' + extension;
};

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid file type';
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter,
});

async function fileUpload(req, res, next) {
  const multerUpload = upload.any();

  multerUpload(req, res, async (err) => {
    if (req.fileValidationError) {
      return res.end(req.fileValidationError);
    }
    if (err instanceof multer.MulterError) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading file',
        error: err.message,
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log('General error:', err.message);

      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing',
        error: err.message,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const file = req.files[0];

    const getFileName = generateFileName(file.mimetype);

    file.originalname = file.mimetype.startsWith('video/')
      ? 'public/videos/' + getFileName
      : 'public/images/' + getFileName;
    req.fileKey = file.originalname;
    if (file.mimetype.startsWith('image/')) {
      try {
        const fileBuffer = await sharp(file.buffer)
          .resize({ height: 1920, width: 1080, fit: 'contain' })
          .toBuffer();

        file.buffer = fileBuffer;
      } catch (sharpError) {
        return res.status(500).json({
          success: false,
          message: 'Error processing image',
          error: sharpError.message,
        });
      }
    }

    try {
      const { fileLink, result } = await AwsUploadFile({
        fileBuffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
      });

      req.fileUrl = fileLink;
      req.fileType = file.mimetype.split('/')[0];
      next();
    } catch (awsError) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading to AWS',
        error: awsError.message,
      });
    }
  });
}

module.exports = fileUpload;