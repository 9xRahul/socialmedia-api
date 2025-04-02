require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/error-handler");
const logger = require("./utils/logger");
const { connetRabbitMq, consumeEvent } = require("./utils/rabbitmq");
const { mongoConnection } = require("./config/db");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");

const app = express();
const PORT = process.env.PORT || 3004;
mongoConnection;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connetRabbitMq();
    //consume or subscribe the events

    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(` Search-Service service runnnig on port : ${PORT}`);
    });
  } catch (error) {
    logger.error(error, "Failed to start search service");
    process.exit(1);
  }
}

startServer();
