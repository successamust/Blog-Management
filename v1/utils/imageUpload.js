import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from './cloudinary.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

export const uploadImage = upload.single('image');

export const processImageUpload = async (file, folder = 'blog') => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const result = await uploadToCloudinary(file.buffer, folder);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) {
      throw new Error('Invalid image URL');
    }
    
    const result = await deleteFromCloudinary(publicId);
    return result;
  } catch (error) {
    console.error('Delete image error:', error);
  }
};