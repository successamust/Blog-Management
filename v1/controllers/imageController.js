import { processImageUpload, deleteImage } from '../utils/imageUpload.js';
import Post from '../models/post.js';
import User from '../models/user.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided'
      });
    }

    const folder = req.query.type === 'profile' ? 'blog-profile-pictures' : 'blog';
    const imageData = await processImageUpload(req.file, folder);

    res.json({
      message: 'Image uploaded successfully',
      image: imageData,
      url: imageData.url,
      imageUrl: imageData.url
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      message: error.message || 'Failed to upload image'
    });
  }
};

export const deleteImageFromCloudinary = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        message: 'Image URL is required'
      });
    }

    const postsUsingImage = await Post.findOne({ 
      featuredImage: imageUrl 
    });

    if (postsUsingImage) {
      return res.status(400).json({
        message: 'Cannot delete image. It is currently used in a blog post.'
      });
    }

    const usersUsingImage = await User.findOne({ 
      profilePicture: imageUrl 
    });

    if (usersUsingImage) {
      return res.status(400).json({
        message: 'Cannot delete image. It is currently used as a profile picture.'
      });
    }

    await deleteImage(imageUrl);

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      message: 'Failed to delete image'
    });
  }
};

export const getImageInfo = async (req, res) => {
  try {
    res.json({
      message: 'Store image URLs in your posts. Cloudinary handles the files.'
    });
  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({
      message: 'Failed to get image information'
    });
  }
};