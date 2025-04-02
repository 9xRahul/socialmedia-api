require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-routes");
const errorHandler = require("./middleware/error-handler");
const logger = require("./utils/logger");
const { mongoConnection } = require("./config/db");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connetRabbitMq, consumeEvent } = require("./utils/rabbitmq");

const { handlePostDeleted } = require("./event-handlers/media-event-handlers");

const app = express();
const PORT = process.env.PORT || 3003;
mongoConnection;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

//add ip based rate limit

app.use("/api/media", mediaRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connetRabbitMq();

      await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(` Media-Service service runnnig on port : ${PORT}`);
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
