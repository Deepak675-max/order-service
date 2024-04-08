const amqplib = require("amqplib");
const { ORDER_QUEUE, CART_QUEUE, PRODUCT_QUEUE } = require("../../config/index");
const OrderService = require("../../services/order/order.service");
const { logger } = require("../error_logger/winston");

let channel, connection;

const connectToMessageBroker = async () => {
    try {
        connection = await amqplib.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue(ORDER_QUEUE);
    } catch (error) {
        console.log(error);
        logger.error(error.message, { status: error.status, path: __filename });
        throw error;
    }
}

const sendDateToQueue = async (queueName, data, event) => {
    try {
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ data, event })));
    } catch (error) {
        console.log(error);
        logger.error(error.message, { status: error.status, path: __filename });
        throw error;
    }
}


module.exports = {
    connectToMessageBroker,
    sendDateToQueue,
};