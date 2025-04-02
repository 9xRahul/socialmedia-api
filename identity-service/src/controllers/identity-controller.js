const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const User = require("../models/User");
const generateTokens = require("../utils/generate-token");
const RefreshToken = require("../models/RefreshToken");

const registerUser = async (req, res) => {
  logger.info("Register endpoint hit..");
  try {
    // Validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save();
    logger.info("User created Successfully", user._id);

    // Generate tokens
    logger.info("Generating tokens...");
    const { accessToken, refreshToken } = await generateTokens(user);
    logger.info("Tokens generated successfully");

    return res.status(201).json({
      status: true,
      message: "User Created Successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

//user login function

const loginUser = async (req, res) => {
  logger.info("Login end point hit");

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Invalid User");
      return res.status(400).json({
        status: false,
        message: "Invalid Credentials",
      });
    }

    //check for passssword validation
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid Password");
      return res.status(400).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login  error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const refreshTokenUser = async (req, res) => {
  logger.info("Refresh token endpoint hit");
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: false,
        message: "Refresh token missing",
      });
    }

    const storedRefreshToken = await RefreshToken.findOne({
      token: refreshToken,
    });
    if (!storedRefreshToken || storedRefreshToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(401).json({
        status: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedRefreshToken.user);

    if (!user) {
      logger.warn("Invalid User ");
      return res.status(401).json({
        status: false,
        message: "Invalid User",
      });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);
    //delete existing refresh token

    await RefreshToken.deleteOne({ _id: storedRefreshToken._id });
    res.json({
      status: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("R̥efresh token error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const logoutUser = async (req, res) => {
  logger.info("Logout user endpoint hit");
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: false,
        message: "Refresh token missing",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh Token deleted");

    res.json({
      status: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Error while logout", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
