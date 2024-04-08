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

    async getOrders(queryDetails) {
        try {
            const { where, skip, pageSize, sort } = queryDetails;
            const orders = await OrderModel
                .find(where)
                .skip(skip)
                .limit(pageSize)
                .sort(sort)
                .select("-isDeleted -createdAt -updatedAt")
                .lean()

            return orders;
        } catch (error) {
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const order = await OrderModel.findOne({
                _id: orderId,
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
}

module.exports = OrderService;