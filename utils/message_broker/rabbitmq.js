const amqplib = require("amqplib");
const { ORDER_QUEUE } = require("../../config/index");
const OrderService = require("../../services/order/order.service");

const connectToMessageBroker = async () => {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertQueue(ORDER_QUEUE);
    return { channel, connection };
}

const consumeMessage = (channel, connection) => {
    return new Promise((resolve, reject) => {
        channel.consume(ORDER_QUEUE, async (msg) => {
            const payload = JSON.parse(msg.content.toString());
            const orderServiceInstance = new OrderService();
            // Retrieve data based on event
            const serviceResponse = await orderServiceInstance.SubscribeEvents(payload);
            // Send service Response
            if (payload.service == "Cart")
                channel.sendToQueue(CART_QUEUE, Buffer.from(JSON.stringify(serviceResponse)));
            if (payload.service == "Product")
                channel.sendToQueue(PRODUCT_QUEUE, Buffer.from(JSON.stringify(serviceResponse)));
        }, { noAck: true });
    });
}

module.exports = {
    connectToMessageBroker,
    consumeMessage,
};