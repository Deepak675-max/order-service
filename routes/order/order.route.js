const express = require("express");

const orderServiceRouter = express.Router();

const authMiddleware = require('../../middlewares/auth.middleware');

const orderController = require('../../controllers/order/order.controller');

orderServiceRouter.post('/create-order',
    authMiddleware.authenticateUser,
    orderController.createOrder
);

orderServiceRouter.post('/get-orders',
    authMiddleware.authenticateUser,
    orderController.getOrders
);
orderServiceRouter.get('/get-order-details/:id',
    authMiddleware.authenticateUser,
    orderController.getOrderDetails
);

orderServiceRouter.put('/cancel-order',
    authMiddleware.authenticateUser,
    orderController.cancelOrder
);

module.exports = orderServiceRouter;