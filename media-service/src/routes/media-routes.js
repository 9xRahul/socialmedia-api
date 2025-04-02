const express = require("express");

const multer = require("multer");

const { uploadMedia, getAllMedia } = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/auth-middleware");
const logger = require("../utils/logger");

const router = express.Router();

//configure multe for file upload

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer error while uploading ${err}`);
        return res.status(400).json({
          status: false,
          message: `Error while uploading ${err}`,
          stack: err.stack,
        });
      } else if (err) {
        logger.error(`Unknown error multer upload`);
        return res.status(500).json({
          status: false,
          message: ` Unknown Error while uploading`,
          stack: err.stack,
        });
      }

      if (!req.file) {
        logger.error("No file selected please select atleast one");
        return res.status(400).json({
          status: false,
          message: "Please Select at least one file",
        });
      }
      next();
    });
  },
  uploadMedia
);

router.get("/get", authenticateRequest, getAllMedia);
module.exports = router;
