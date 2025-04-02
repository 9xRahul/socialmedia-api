const express = require("express");
const { searchPostCOntroller } = require("../controllers/search-controller");
const { authenticateRequest } = require("../middleware/auth-middleware");

const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostCOntroller);

module.exports = router;
