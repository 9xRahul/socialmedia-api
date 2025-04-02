require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/error-handler");
const logger = require("./utils/logger");
const { mongoConnection } = require("./config/db");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const { connetRabbitMq } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;
mongoConnection;
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// const sensitiveEndPointLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000,
//   max: 5,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Sensitive nd pint rate limit exceeded for ip : ${req.ip}`);
//     res.status(429).json({
//       status: false,
//       message: "Too many requests",
//     });
//   },
//   store: new RedisStore({
//     sendCommand: (...args) => redisClient.call(...args),
//   }),
// });

// app.use("api/post/create-post", sensitiveEndPointLimiter);

//routes => passredis client

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connetRabbitMq();
    app.listen(PORT, () => {
      logger.info(` Post-Service service runnnig on port : ${PORT}`);
    });
  } catch (error) {
    logger.error("Faild to connect to server");
    process.exit(1);
  }
}
startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection at", promise, "Reason :", reason);
});
