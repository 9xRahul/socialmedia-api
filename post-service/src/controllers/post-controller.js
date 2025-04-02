const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const { publishingEvent } = require("../utils/rabbitmq");
const Post = require("../models/Post");

async function invalidateCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create post end point hit");
  try {
    const { content, mediaIds } = req.body;

    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    console.log("reched till post create");
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content: content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await publishingEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    });
    
    await invalidateCache(req, newlyCreatedPost._id.toString());

    logger.info("Post Created Succesfully", newlyCreatedPost);
    return res.status(201).json({
      status: true,
      message: "Post Created Succesfully",
    });
  } catch (error) {
    logger.error("Create post error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Create post error occurred",
    });
  }
};

const getAllPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNumberOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalpages: Math.ceil(totalNumberOfPosts / limit),
      totalPosts: totalNumberOfPosts,
    };
    //save post in redis cache if its loading for the fitst time
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    logger.error("Get all post error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Get all post error occurred",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;

    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }
    const getSinglePostDetailsById = await Post.findById(postId);
    if (!getSinglePostDetailsById) {
      return res.status(404).json({
        ststus: false,
        message: "Post not found",
      });
    }

    await req.redisClient.setex(
      cachedPost,
      3600,
      JSON.stringify(getSinglePostDetailsById)
    );

    res.json(getSinglePostDetailsById);
  } catch (error) {
    logger.error("Get  post error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Get  post error occurred",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findOneAndDelete({
      _id: postId,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        status: false,
        message: "post not found",
      });
    }

    //publish delete post method

    await publishingEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidateCache(req, postId.toString());
    res.status(200).json({
      status: true,
      message: "Post deleted",
    });
  } catch (error) {
    logger.error("Delete  post error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Delete  post error occurred",
    });
  }
};

module.exports = { createPost, getAllPost, getPost, deletePost };
