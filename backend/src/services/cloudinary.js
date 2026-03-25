const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signed upload signature so the browser can upload
 * directly to Cloudinary (saves server bandwidth).
 */
function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: 'clipai/raw',
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: 'clipai/raw',
  };
}

/**
 * Delete an asset from Cloudinary.
 * @param {string} publicId - The public ID of the asset.
 * @param {string} resourceType - The type of resource ('video', 'image', 'raw').
 */
async function deleteFromCloudinary(publicId, resourceType = 'video') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    throw err;
  }
}

module.exports = { cloudinary, generateUploadSignature, deleteFromCloudinary };
