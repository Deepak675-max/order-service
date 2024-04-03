const OrderModel = require("../../models/order/order.model");
const httpErrors = require("http-errors");

class OrderService {

    async createOrder(orderDetails) {
        try {
            const newOrder = new OrderModel(orderDetails);
            const createdOrder = await newOrder.save();
            return createdOrder;
        } catch (error) {
            throw error;
        }
    }

    async getOrders(userId) {
        try {
            const orders = await OrderModel.find({
                customerId: userId,
                isDeleted: false
            });
            return orders;
        } catch (error) {
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const order = await OrderModel.findOne({
                orderId: orderId,
                isDeleted: false
            });
            if (!order) throw httpErrors.NotFound('Order not found');
            return order;
        } catch (error) {
            throw error;
        }
    }

    async cancelOrder(orderId) {
        try {
            const order = await this.getOrderDetails(orderId);
            await order.updateOne({
                $set: {
                    status: "canceled"
                }
            }, {
                new: true
            })
        } catch (error) {
            throw error;
        }
    }

    async SubscribeEvents(payload) {
        // describe events here.
    }
}

module.exports = OrderService;