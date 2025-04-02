const express = require("express");
const {
  createPost,
  getAllPost,
  getPost,
  deletePost,
} = require("../controllers/post-controller");
const { authenticateRequest } = require("../middleware/auth-middleware");

const router = express();

//middleware -> this will tell if the user is an auth user or not
router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/posts", getAllPost);
router.get("/:id", getPost);
router.delete("/delete/:id", deletePost);
module.exports = router;
