const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ApiError } = require('../middleware/errorHandler');
const { compressImage, generateThumbnail } = require('./imageProcessor');
const logger = require('../config/logger');

// File upload configuration with automatic image compression

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const createSubDirectories = () => {
  const subDirs = ['images', 'documents', 'avatars', 'temp', 'thumbnails'];
  subDirs.forEach(dir => {
    const fullPath = path.join(uploadDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createSubDirectories();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.uploadSubDir || 'general';
    const fullPath = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    let sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Check if filename contains terms often blocked by AdBlockers (like tenant, owner, admin)
    const lowerName = sanitizedBasename.toLowerCase();
    const sensitiveTerms = ['tenant', 'tenent', 'owner', 'ownwer', 'admin', 'advert', 'track'];
    if (sensitiveTerms.some(term => lowerName.includes(term))) {
      sanitizedBasename = `beaver_file_${uniqueSuffix.substring(0, 8)}`;
    }
    
    cb(null, `${sanitizedBasename}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = req.allowedMimes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
  }
});

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

const getFileUrl = (filePath) => {
  let baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  // Remove trailing slash if exists to avoid double slashes in output
  baseUrl = baseUrl.replace(/\/$/, '');
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

const processUploadedImage = async (file, options = {}) => {
  const {
    compress = true,
    generateThumb = false,
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1080
  } = options;
  
  const isImage = file.mimetype.startsWith('image/');
  
  if (!isImage || !compress) {
    return file;
  }
  
  try {
    await compressImage(file.path, { quality, maxWidth, maxHeight });
    
    if (generateThumb) {
      const thumbPath = path.join(uploadDir, 'thumbnails', `thumb_${file.filename}`);
      await generateThumbnail(file.path, thumbPath, 200);
      file.thumbnailPath = thumbPath;
      file.thumbnailUrl = getFileUrl(thumbPath);
    }
    
    const stats = fs.statSync(file.path);
    file.compressedSize = stats.size;
    
    logger.info(`Image processed: ${file.filename} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    return file;
  } catch (error) {
    logger.error('Image processing failed:', error);
    return file;
  }
};

const uploadWithCompression = (fieldName, options = {}) => {
  return async (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) return next(err);
      
      if (req.file && process.env.ENABLE_IMAGE_COMPRESSION !== 'false') {
        req.file = await processUploadedImage(req.file, options);
      }
      
      next();
    });
  };
};

const uploadMultipleWithCompression = (fieldName, maxCount, options = {}) => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) return next(err);
      
      if (req.files && req.files.length > 0 && process.env.ENABLE_IMAGE_COMPRESSION !== 'false') {
        req.files = await Promise.all(
          req.files.map(file => processUploadedImage(file, options))
        );
      }
      
      next();
    });
  };
};

module.exports = {
  upload,
  deleteFile,
  getFileUrl,
  uploadDir,
  processUploadedImage,
  uploadWithCompression,
  uploadMultipleWithCompression
};
