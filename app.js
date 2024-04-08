const express = require('express');
const httpErrors = require("http-errors");
const cors = require("cors");
const path = require("path");
const orderServiceBackendApp = express();
const http = require('http');
const cookieParser = require('cookie-parser');
require("./utils/database/init_mongodb");
const server = http.createServer(orderServiceBackendApp);
const { APP_PORT } = require("./config/index");

orderServiceBackendApp.use(cors({
    origin: "*",
    credentials: true,
}));

orderServiceBackendApp.use(cookieParser());
orderServiceBackendApp.use(express.json());
orderServiceBackendApp.use(express.urlencoded({ extended: true }));
orderServiceBackendApp.use(express.static(path.join(__dirname, 'public')));

const orderServiceRoutes = require("./routes/order/order.route");
const { connectToMessageBroker } = require('./utils/message_broker/rabbitmq');
orderServiceBackendApp.use("/api", orderServiceRoutes);

orderServiceBackendApp.use(async (req, _res, next) => {
    next(httpErrors.NotFound(`Route not Found for [${req.method}] ${req.url}`));
});

// Common Error Handler
orderServiceBackendApp.use((error, req, res, next) => {
    const responseStatus = error.status || 500;
    const responseMessage =
        error.message || `Cannot resolve request [${req.method}] ${req.url}`;
    if (res.headersSent === false) {
        res.status(responseStatus);
        res.send({
            error: {
                status: responseStatus,
                message: responseMessage,
            },
        });
    }
    next();
});

const port = APP_PORT;

server.listen(port, async () => {
    console.log("Order Service is running on the port " + port)
    await connectToMessageBroker();
})




