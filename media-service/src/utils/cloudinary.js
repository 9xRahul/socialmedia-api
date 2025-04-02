const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.warn(`Cloudinary upload error occured ${error}`);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("Media deleted succesfullt from cloudinary", publicId);
    return result;
  } catch (error) {
    logger.error("media delete cloudinary  error occurred", error);

    throw error;

    // return res.status(500).json({
    //   status: false,
    //   message: "Delete  media from cloudinary  error occurred",
    // });
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
