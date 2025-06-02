const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createError } = require('../middleware/error');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const createSubDirectories = () => {
  const subdirs = ['products', 'users', 'reviews', 'temp'];
  subdirs.forEach(dir => {
    const fullPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createSubDirectories();

// File filter function
const fileFilter = (allowedTypes = ['image']) => {
  return (req, file, cb) => {
    // Define allowed MIME types
    const allowedMimeTypes = {
      image: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      video: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime'
      ]
    };

    // Get allowed MIME types based on allowed types
    let allowedMimes = [];
    allowedTypes.forEach(type => {
      if (allowedMimeTypes[type]) {
        allowedMimes = allowedMimes.concat(allowedMimeTypes[type]);
      }
    });

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = createError.badRequest(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        'INVALID_FILE_TYPE'
      );
      cb(error, false);
    }
  };
};

// Generate unique filename
const generateFileName = (originalname) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalname).toLowerCase();
  const baseName = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  return `${timestamp}_${random}_${baseName}${ext}`;
};

// Local storage configuration
const localStorage = (destination = 'temp') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(uploadsDir, destination);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const filename = generateFileName(file.originalname);
      cb(null, filename);
    }
  });
};

// Memory storage for processing before upload to cloud
const memoryStorage = multer.memoryStorage();

// File size limits (in bytes)
const fileSizeLimits = {
  image: 5 * 1024 * 1024,    // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024     // 50MB
};

// Create multer instance for different use cases
const createUpload = (options = {}) => {
  const {
    storage = 'local',
    destination = 'temp',
    fileTypes = ['image'],
    maxFileSize = fileSizeLimits.image,
    maxFiles = 1,
    fieldName = 'file'
  } = options;

  const storageEngine = storage === 'memory' ? memoryStorage : localStorage(destination);

  return multer({
    storage: storageEngine,
    fileFilter: fileFilter(fileTypes),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fieldSize: 1024 * 1024 // 1MB for form fields
    }
  });
};

// Predefined upload configurations
const uploadConfigs = {
  // Single product image
  productImage: createUpload({
    destination: 'products',
    fileTypes: ['image'],
    maxFileSize: fileSizeLimits.image,
    maxFiles: 1
  }),

  // Multiple product images
  productImages: createUpload({
    destination: 'products',
    fileTypes: ['image'],
    maxFileSize: fileSizeLimits.image,
    maxFiles: 10
  }),

  // User profile picture
  userAvatar: createUpload({
    destination: 'users',
    fileTypes: ['image'],
    maxFileSize: 2 * 1024 * 1024, // 2MB for avatars
    maxFiles: 1
  }),

  // Review images
  reviewImages: createUpload({
    destination: 'reviews',
    fileTypes: ['image'],
    maxFileSize: fileSizeLimits.image,
    maxFiles: 5
  }),

  // Memory storage for cloud upload
  cloudUpload: createUpload({
    storage: 'memory',
    fileTypes: ['image'],
    maxFileSize: fileSizeLimits.image,
    maxFiles: 10
  })
};

// Cloudinary configuration (optional)
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  } catch (error) {
    console.warn('Cloudinary not configured properly:', error.message);
  }
}

// Upload to Cloudinary
const uploadToCloudinary = async (file, options = {}) => {
  if (!cloudinary) {
    throw new Error('Cloudinary not configured');
  }

  const {
    folder = 'marketly',
    transformation = { quality: 'auto', fetch_format: 'auto' },
    public_id = null
  } = options;

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          transformation: transformation,
          public_id: public_id,
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Handle both buffer and file path
      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else if (file.path) {
        const fileStream = fs.createReadStream(file.path);
        fileStream.pipe(uploadStream);
      } else {
        reject(new Error('Invalid file format'));
      }
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw createError.internal(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  if (!cloudinary) {
    throw new Error('Cloudinary not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    throw createError.internal(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

// Clean up local files
const cleanupLocalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error cleaning up local file:', error);
    return false;
  }
};

// Clean up multiple local files
const cleanupLocalFiles = (files) => {
  if (!Array.isArray(files)) {
    files = [files];
  }

  files.forEach(file => {
    if (file.path) {
      cleanupLocalFile(file.path);
    }
  });
};

// Validate image dimensions
const validateImageDimensions = (file, minWidth = 100, minHeight = 100, maxWidth = 4000, maxHeight = 4000) => {
  return new Promise((resolve, reject) => {
    if (!file.buffer && !file.path) {
      return reject(new Error('Invalid file'));
    }

    // This would require additional image processing library like sharp
    // For now, we'll just resolve true
    resolve(true);
  });
};

// Resize image (requires sharp package)
const resizeImage = async (file, width, height, quality = 80) => {
  try {
    // This would require the sharp package
    // const sharp = require('sharp');
    // const resizedBuffer = await sharp(file.buffer)
    //   .resize(width, height, { fit: 'cover' })
    //   .jpeg({ quality })
    //   .toBuffer();
    // return resizedBuffer;
    
    // For now, return original file
    return file;
  } catch (error) {
    throw createError.internal(`Failed to resize image: ${error.message}`);
  }
};

// Process uploaded files
const processUploadedFiles = async (files, options = {}) => {
  if (!files || files.length === 0) {
    return [];
  }

  const {
    uploadToCloud = false,
    folder = 'marketly',
    resize = null,
    cleanup = true
  } = options;

  const processedFiles = [];

  for (const file of files) {
    try {
      let fileData = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      };

      // Upload to Cloudinary if configured
      if (uploadToCloud && cloudinary) {
        const cloudResult = await uploadToCloudinary(file, { folder });
        fileData = {
          ...fileData,
          url: cloudResult.url,
          public_id: cloudResult.public_id,
          cloudinary: cloudResult
        };

        // Cleanup local file if uploaded to cloud
        if (cleanup && file.path) {
          cleanupLocalFile(file.path);
        }
      } else {
        // Use local file URL
        fileData.url = `/uploads/${path.relative(uploadsDir, file.path)}`;
      }

      processedFiles.push(fileData);
    } catch (error) {
      console.error('Error processing file:', error);
      // Cleanup failed file
      if (file.path) {
        cleanupLocalFile(file.path);
      }
    }
  }

  return processedFiles;
};

// Middleware to handle upload errors
const handleUploadError = (error, req, res, next) => {
  // Cleanup uploaded files on error
  if (req.files) {
    cleanupLocalFiles(req.files);
  } else if (req.file) {
    cleanupLocalFiles([req.file]);
  }

  next(error);
};

module.exports = {
  createUpload,
  uploadConfigs,
  uploadToCloudinary,
  deleteFromCloudinary,
  cleanupLocalFile,
  cleanupLocalFiles,
  validateImageDimensions,
  resizeImage,
  processUploadedFiles,
  handleUploadError,
  generateFileName
}; 