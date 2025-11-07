// Cloudinary 설정
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
  folder: 'shopping-mall/products',
  maxFileSize: 5000000, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  maxFiles: 10
};
