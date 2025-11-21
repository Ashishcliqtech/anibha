const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig"); // Ensure this initializes cloudinary correctly
const { AppError } = require("../utils/errorUtils");
const { ERROR_MESSAGES } = require("../utils/constant/Messages");
const logger = require('../utils/logger');

// --- Multer Storage Configuration ---
const storage = multer.memoryStorage(); // Crucial for Cloudinary uploads (access to buffer)

// --- Multer File Filters ---
const imageFileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError(ERROR_MESSAGES.INVALID_IMAGE_FILE, 400), false);
    }
  } catch (err) {
    cb(err, false);
  }
};

const pdfFileFilter = (req, file, cb) => {
  try {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new AppError(ERROR_MESSAGES.INVALID_PDF_FILE, 400), false);
    }
  } catch (err) {
    cb(err, false);
  }
};

// --- Multer Instances ---
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB

const imageMulterUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

const pdfMulterUpload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_PDF_SIZE,
  },
});

/**
 * Generic Cloudinary upload handler.
 * This abstracts the common logic for uploading to Cloudinary.
 * @param {Object} req - The Express request object.
 * @param {Function} next - The Express next middleware function.
 * @param {string} fieldName - The name of the field in the form that contains the file.
 * @param {string} errorMessage - Specific error message for Cloudinary failure.
 * @param {string} targetFolder - The specific folder name in Cloudinary (e.g., 'blogs', 'certificates').
 */
const handleCloudinaryUpload = async (
  req,
  res,
  next,
  fieldName,
  errorMessage,
  targetFolder
) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, proceed. Your schema validation should handle required fields.
    }

    // Defensive check for cloudinary initialization
    if (!cloudinary || !cloudinary.uploader) {
      logger.error('Cloudinary SDK not properly initialized or imported. Check config/cloudinaryConfig.js and your .env variables.');
      return next(new AppError(errorMessage, 500));
    }

    try {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: targetFolder,
          resource_type: 'auto',
        }
      );
      req.body[fieldName] = result.secure_url;
      return next();
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      return next(new AppError(errorMessage, 500));
    }
  } catch (err) {
    return next(new AppError(errorMessage, 500));
  }
};

/**
 * Middleware function to handle image upload and push to Cloudinary.
 * @param {string} fieldName - The name of the field in the form (e.g., 'image').
 * @param {string} folderName - The specific folder in Cloudinary for this upload (e.g., 'blogs', 'events').
 * @returns {function} Express middleware function.
 */
const uploadImageToCloudinary = (fieldName, folderName) => {
  return (req, res, next) => {
    try {
      imageMulterUpload.single(fieldName)(req, res, async (err) => {
        try {
          if (err instanceof multer.MulterError) {
            return next(new AppError(`${ERROR_MESSAGES.FILE_SIZE_EXCEEDED}: ${err.message}`, 400));
          } else if (err) {
            return next(err);
          }
          // Pass the folderName to the handler
          await handleCloudinaryUpload(req, res, next, fieldName, ERROR_MESSAGES.IMAGE_UPLOAD_FAILED, folderName);
        } catch (error) {
          return next(error);
        }
      });
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Middleware function to handle PDF upload and push to Cloudinary.
 * @param {string} fieldName - The name of the field in the form (e.g., 'pdfDocument').
 * @param {string} folderName - The specific folder in Cloudinary for this upload (e.g., 'certificates').
 * @returns {function} Express middleware function.
 */
const uploadPdfToCloudinary = (fieldName, folderName) => {
  return (req, res, next) => {
    try {
      pdfMulterUpload.single(fieldName)(req, res, async (err) => {
        try {
          if (err instanceof multer.MulterError) {
            return next(new AppError(`${ERROR_MESSAGES.FILE_SIZE_EXCEEDED}: ${err.message}`, 400));
          } else if (err) {
            return next(err);
          }
          // Pass the folderName to the handler
          await handleCloudinaryUpload(req, res, next, fieldName, ERROR_MESSAGES.PDF_UPLOAD_FAILED, folderName);
        } catch (error) {
          return next(error);
        }
      });
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Upload multiple named fields (e.g., `mainImage` single + `images` array) in one request.
 * fieldsArray: [{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]
 */
const uploadImagesToCloudinary = (fieldsArray, folderName) => {
  return (req, res, next) => {
    try {
      imageMulterUpload.fields(fieldsArray)(req, res, async (err) => {
        try {
          if (err instanceof multer.MulterError) {
            return next(new AppError(`${ERROR_MESSAGES.FILE_SIZE_EXCEEDED}: ${err.message}`, 400));
          } else if (err) {
            return next(err);
          }

          if (!req.files || Object.keys(req.files).length === 0) {
            return next();
          }

          if (!cloudinary || !cloudinary.uploader) {
            logger.error('Cloudinary SDK not properly initialized or imported. Check config/cloudinaryConfig.js and your .env variables.');
            return next(new AppError(ERROR_MESSAGES.IMAGE_UPLOAD_FAILED, 500));
          }

          // For each configured field upload all files and set req.body[fieldName]
          const uploadPromises = [];
          Object.keys(req.files).forEach((fieldName) => {
            const files = req.files[fieldName];
            if (!files || files.length === 0) return;

            // upload each file in this field
            const p = Promise.all(files.map(async (file) => {
              const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
              const result = await cloudinary.uploader.upload(dataUri, {
                folder: folderName,
                resource_type: 'auto'
              });
              return result.secure_url;
            })).then((urls) => {
              // If field expects single, set string, else set array
              const cfg = fieldsArray.find(f => f.name === fieldName);
              if (cfg && cfg.maxCount === 1) {
                req.body[fieldName] = urls[0];
              } else {
                // merge with existing req.body[fieldName] if present
                const existing = req.body[fieldName];
                if (existing) {
                  if (Array.isArray(existing)) req.body[fieldName] = existing.concat(urls);
                  else req.body[fieldName] = [existing].concat(urls);
                } else {
                  req.body[fieldName] = urls;
                }
              }
            });

            uploadPromises.push(p);
          });

          await Promise.all(uploadPromises);
          return next();
          } catch (error) {
          logger.error('Cloudinary multi upload failed:', error);
          return next(new AppError(ERROR_MESSAGES.IMAGE_UPLOAD_FAILED, 500));
        }
      });
    } catch (err) {
      return next(err);
    }
  };
};

// export the new multi-field uploader
// export everything from one place for clarity
module.exports = {
  uploadImageToCloudinary,
  uploadPdfToCloudinary,
  uploadImagesToCloudinary
};

