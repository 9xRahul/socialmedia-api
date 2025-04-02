const logger = require("../utils/logger");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const { Media } = require("../models/Media");

const uploadMedia = async (req, res) => {
  logger.info(" starting media upload ");

  try {
    if (!req.file) {
      logger.error("No file selected please select atleast one");
      return res.status(400).json({
        status: false,
        message: "Please Select at least one file",
      });
    }
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File name ${originalname} type :${mimetype} `);
    logger.info(`Uploading to cloudinary starting`);
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload succes : publicId:${cloudinaryUploadResult.public_id}`
    );
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      orignalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId: req.user.userId,
    });
    await newlyCreatedMedia.save();
    res.status(201).json({
      status: true,
      message: "Media Upload success",
      mediaId: newlyCreatedMedia.id,
      meduaUrl: newlyCreatedMedia.url,
    });
  } catch (error) {
    logger.error("media upload   error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Upload media  error occurred",
    });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const result = await Media.find({});
    res.json(result);
  } catch (error) {
    logger.error("media getall  medai service  error occurred", error);

    return res.status(500).json({
      status: false,
      message: "getall media media service  error occurred",
    });
  }
};
module.exports = { uploadMedia, getAllMedia };
