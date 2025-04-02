const mongoose = require("mongoose");
const logger = require("../utils/logger");

//connect to database
const mongoConnection = mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Mongo db connected succesfully");
  })
  .catch((e) => logger.error("Mongo conection error"));

module.exports = mongoConnection;
