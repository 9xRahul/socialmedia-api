require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const mongoConnection = require("./config/db");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimiterRedis, RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/error-handler");

const app = express();

const PORT = process.env.PORT;
//connect to database
mongoConnection;
const redisClient = new Redis(process.env.REDIS_URL);

//user middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

//DDOs Protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Ratelimit exceeded  for IP :${req.ip}`);
      res.status(429).json({
        status: false,
        message: "Too many requests",
      });
    });
});

//ip based rate limiting for sensitive end points

const sensitiveEndPointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive nd pint rate limit exceeded for ip : ${req.ip}`);
    res.status(429).json({
      status: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply sensitive rate limit in all end points
app.use("api/auth/register", sensitiveEndPointLimiter);

//Routes
app.use("/api/auth", routes);

//error handler
app.use(errorHandler);

//start server

app.listen(PORT, () => {
  logger.info(` Identity service runnnig on port : ${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection at", promise, "Reason :", reason);
});
