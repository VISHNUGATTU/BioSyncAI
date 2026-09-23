import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadToCloudinary = async (fileBuffer, folderName = 'medical_app', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folderName,
        resource_type: resourceType,
        quality: 'auto:good' // Automatic image compression for mobile speed
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Pipe the buffer safely through a readable stream
    Readable.from(fileBuffer)
      .on('error', (err) => reject(err))
      .pipe(uploadStream);
  });
};

export { cloudinary, uploadToCloudinary };