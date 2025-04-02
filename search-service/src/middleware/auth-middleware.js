const logger = require("../utils/logger");

const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn("Access attmepeted withot userId");
    return res.satus(401).json({
      success: false,
      message: "Authentocation required please login",
    });
  }
  req.user = { userId };
  next();
};

module.exports = { authenticateRequest };
