const logger = require("../utils/logger");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const { Media } = require("../models/Media");

const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    const mediasToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediasToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(`Deleted Media : ${media._id} associated with ${postId}`);
    }

    logger.info(`Processed deletion of media for post id : ${postId}`);
  } catch (error) {
    logger.error("Error while deleteing the media", error);
  }
};

module.exports = { handlePostDeleted };
