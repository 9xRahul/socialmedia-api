const Search = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    await newSearchPost.save();
    logger.info(
      `Search post crated :${event.postId} , ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error(` error handling post creatin event ${error}`);
  }
}

async function handlePostDeleted(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(
      `Search post deleted :${event.postId} , ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error(` error handling post delete event ${error}`);
  }
}

module.exports = { handlePostCreated, handlePostDeleted };
