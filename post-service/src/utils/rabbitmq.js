const ampq = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "socialmedia_events";

async function connetRabbitMq() {
  try {
    connection = await ampq.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (error) {
    logger.error("Errocr connecting to rabbit mq", error);
  }
}

async function publishingEvent(routingKey, message) {
  if (!channel) {
    await connetRabbitMq();
  }
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event published ${routingKey}`);
}

module.exports = { connetRabbitMq, publishingEvent };
