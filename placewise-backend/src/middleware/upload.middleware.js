const multer = require('multer');
const { error } = require('../utils/response');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf'];


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are accepted.'),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});


const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, 413, 'File too large. Maximum resume size is 5 MB.');
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return error(res, 415, 'Invalid file type. Only PDF resumes are accepted.');
      }
      return error(res, 400, `Upload error: ${err.message}`);
    }

    return error(res, 500, 'File upload failed. Please try again.');
  });
};

const uploadOfferLetter = (req, res, next) => {
  upload.single('offer_letter')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, 413, 'File too large. Maximum size is 5 MB.');
      }
      return error(res, 400, `Upload error: ${err.message}`);
    }

    return error(res, 500, 'File upload failed. Please try again.');
  });
};

module.exports = { uploadResume, uploadOfferLetter };