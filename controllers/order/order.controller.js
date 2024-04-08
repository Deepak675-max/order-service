const httpErrors = require("http-errors");
const joiOrder = require("../../utils/joi/order/order.joi_validation");
const OrderModel = require("../../models/order/order.model");
const { logger } = require("../../utils/error_logger/winston");
const Queue = require("../../utils/message_broker/rabbitmq");
const { v4: uuidv4 } = require('uuid');
const amqplib = require("amqplib");
const { CART_QUEUE, PRODUCT_QUEUE, NOTIFICATION_QUEUE, CART_SERVICE_BASE_URL, JWT_ACCESS_TOKEN_HEADER, USER_SERVICE_BASE_URL, DEFAULT_LIMIT, DEFAULT_OFFSET, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } = require("../../config/index")
const { makeAxiosGetRequest, make } = require("../../utils/common/index");

const OrderService = require("../../services/order/order.service");

const orderService = new OrderService();

// const getCartItemsSubTotal = (cartItems) => {
//     let subTotal = 0;
//     cartItems.map(item => {
//         subTotal += item.product.price * item.unit;
//     })
//     return subTotal;
// }

const constructNotification = (user, type, message) => {
    return {
        user: user,
        type: type,
        message: message
    }
}

const createOrder = async (req, res, next) => {
    try {
        const userInput = await joiOrder.createOrderSchema.validateAsync(req.body);

        // const { cart, subTotal } = await getCartDataFromCartService(req.payloadData.userId);
        const headers = {
            Cookie: `access-token=${req.cookies[JWT_ACCESS_TOKEN_HEADER]}`
        }

        const { cart, subTotal } = await makeAxiosGetRequest(`${CART_SERVICE_BASE_URL}/api/get-cart`, headers)

        if (subTotal == 0) throw httpErrors.NotFound("Your cart is empty");

        const orderDetails = {
            orderId: uuidv4(),
            customerId: req.payloadData.userId,
            ...userInput,
            amount: subTotal,
            items: cart.items
        }

        const newOrder = await orderService.createOrder(orderDetails);

        Queue.sendDateToQueue(PRODUCT_QUEUE, cart.items, "UPDATE_PRODUCTS_INVENTORY");

        Queue.sendDateToQueue(CART_QUEUE, req.payloadData.userId, "DELETE_CART_ITEMS");

        const { userProfile } = await makeAxiosGetRequest(`${USER_SERVICE_BASE_URL}/api/profile/${req.payloadData.userId}`, headers)

        console.log(userProfile);

        const notification = constructNotification({ userId: userProfile._id, email: userProfile.email }, "order notification", `your order successfully placed and your Order ID: ${newOrder.orderId}`);

        // await sendNotification(notification);
        Queue.sendDateToQueue(NOTIFICATION_QUEUE, notification, "SEND_NOTIFICATION");

        if (res.headersSent === false) {
            res.status(201).send({
                error: false,
                data: {
                    newOrder: newOrder,
                    message: "Order is created successfully",
                },
            });
        }

    } catch (error) {
        console.log(error);
        if (error?.isJoi === true) error.status = 422;
        logger.error(error.message, { status: error.status, path: __filename });
        next(error);
    }
}

const getOrderDetails = async (req, res, next) => {
    try {
        const { id: orderId } = await joiOrder.getOrderDetailsSchema.validateAsync(req.params);

        const orderDetails = await orderService.getOrderDetails(orderId);

        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    orderDetails: orderDetails,
                    message: "Order is fetched successfully",
                },
            });
        }

    } catch (error) {
        console.log(error);
        if (error?.isJoi === true) error.status = 422;
        logger.error(error.message, { status: error.status, path: __filename });
        next(error);
    }
}

const getOrders = async (req, res, next) => {
    try {
        const querySchema = await joiOrder.getOrdersSchema.validateAsync(req.body);
        const page = querySchema.metaData?.offset || DEFAULT_OFFSET;
        const pageSize = querySchema.metaData?.limit || DEFAULT_LIMIT;
        const sort = {};
        sort[DEFAULT_SORT_BY] = DEFAULT_SORT_ORDER;

        const queryDetails = {
            skip: (page - 1) * pageSize,
            limit: pageSize,
            sort: sort,
            where: {}
        };

        if (querySchema.status) {
            queryDetails.where.status = querySchema.status;
        }

        queryDetails.where.customerId = req.payloadData.userId;

        const orders = await orderService.getOrders(queryDetails);

        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    orders: orders,
                    message: "Orders is fetched successfully",
                },
            });
        }

    } catch (error) {
        console.log(error);
        if (error?.isJoi === true) error.status = 422;
        logger.error(error.message, { status: error.status, path: __filename });
        next(error);
    }
}

const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = await joiOrder.cancelOrderSchema.validateAsync(req.body);

        await orderService.cancelOrder(orderId)

        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    message: "Order is canceled successfully",
                },
            });
        }


    } catch (error) {
        console.log(error);
        if (error?.isJoi === true) error.status = 422;
        logger.error(error.message, { status: error.status, path: __filename });
        next(error);
    }
}

module.exports = {
    createOrder,
    getOrderDetails,
    getOrders,
    cancelOrder
}