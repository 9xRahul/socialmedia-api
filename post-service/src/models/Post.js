const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      require: true,
    },
    mediaIds: [{ type: String }],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

postSchema.index({ contnet: "t ext" });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
