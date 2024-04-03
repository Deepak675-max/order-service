const httpErrors = require("http-errors");
const joiOrder = require("../../utils/joi/order/order.joi_validation");
const OrderModel = require("../../models/order/order.model");
const { logger } = require("../../utils/error_logger/winston");
const { connectToMessageBroker, consumeMessage } = require("../../utils/message_broker/rabbitmq");
const { v4: uuidv4 } = require('uuid');
const { CART_QUEUE, ORDER_QUEUE, PRODUCT_QUEUE } = require("../../config/index")

const OrderService = require("../../services/order/order.service");

const getCartDataFromCartService = async (userId) => {
    const { channel, connection } = await connectToMessageBroker();

    channel.sendToQueue(CART_QUEUE, Buffer.from(JSON.stringify({ userId, event: "GET_CART", service: "Order" })));

    return new Promise(async (resolve, reject) => {
        // Listen for response from cart service
        channel.consume(ORDER_QUEUE, (msg) => {
            const cartData = JSON.parse(msg.content.toString());
            console.log('Received cart items:', cartData);
            resolve(cartData);
        }, { noAck: true });

        setTimeout(() => {
            connection.close();
        }, 500);
    });
}

async function deleteCartItems(userId) {
    const { channel, connection } = await connectToMessageBroker();

    channel.sendToQueue(CART_QUEUE, Buffer.from(JSON.stringify({ userId, event: "DELETE_CART_ITEMS", service: "Order" })));

    setTimeout(() => {
        connection.close()
    }, 500);
}

async function updateProductsInventory(items) {
    const { channel, connection } = await connectToMessageBroker();

    channel.sendToQueue(PRODUCT_QUEUE, Buffer.from(JSON.stringify({ items: items, event: "UPDATE_PRODUCTS_INVENTORY", service: "Order" })));

    setTimeout(() => {
        connection.close()
    }, 500);
}

const orderService = new OrderService();

// const getCartItemsSubTotal = (cartItems) => {
//     let subTotal = 0;
//     cartItems.map(item => {
//         subTotal += item.product.price * item.unit;
//     })
//     return subTotal;
// }

const createOrder = async (req, res, next) => {
    try {
        const userInput = await joiOrder.createOrderSchema.validateAsync(req.body);

        const { cart, subTotal } = await getCartDataFromCartService(req.payloadData.userId);

        // const subTotal = getCartItemsSubTotal(cart.items);
        if (subTotal == 0) throw httpErrors.NotFound("Your cart is empty");

        const orderDetails = {
            orderId: uuidv4(),
            customerId: req.payloadData.userId,
            ...userInput,
            amount: subTotal,
            items: cart.items
        }

        const newOrder = await orderService.createOrder(orderDetails);

        await updateProductsInventory(cart.items);

        await deleteCartItems(req.payloadData.userId)

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
        const orderDetails = await joiOrder.getUserOrderDetailsSchema.validateAsync(req.body);

        const order = (await OrderModel.findOne(
            {
                where: {
                    userId: orderDetails.userId,
                    isDeleted: false
                },
                attributes: {
                    exclude: ["createdAt", "updatedAt", "isDeleted"]
                },
                include: [
                    {
                        model: ProductModel,
                        attributes: ["productName", "id"],
                        through: {
                            attributes: ["productTotalPrice", "productQuantity", "productSize", "productColor"]
                        }
                    }
                ]
            }
        )).get();

        console.log(order.Products);

        const orderItems = await Promise.all(

            order.Products.map(async (product) => {

                const productColor = await ColorModel.findOne({
                    where: {
                        id: product.OrderItems.productColor,
                        isDeleted: false
                    },
                    attributes: ["name"]
                })

                const productFile = await FileModel.findOne({
                    where: {
                        productId: product.id,
                        isDeleted: false,
                        originalname: {
                            [Op.iLike]: `%${productColor.name}%`
                        },
                    },
                    attributes: ["filename"]
                });


                return {
                    productId: product.id,
                    productName: product.productName,
                    productColor: productColor.name,
                    productQuantity: product.OrderItems.productQuantity,
                    productTotalPrice: product.OrderItems.productTotalPrice,
                    productSize: product.OrderItems.productSize,
                    productImageURL: `${process.env.APP_BACKEND_BASE_URL}/files/${productFile.filename}`
                }

            })

        )

        delete order.Products;

        order.Products = orderItems;

        order.shippingAddress = await AddressModel.findOne({
            where: {
                id: order.shippingAddressId,
                isDeleted: false,
            },
            attributes: {
                exclude: ["isDeleted", "createdAt", "updatedAt"]
            }
        });

        order.billingAddress = await AddressModel.findOne({
            where: {
                id: order.billingAddressId,
                isDeleted: false,
            },
            attributes: {
                exclude: ["isDeleted", "createdAt", "updatedAt"]
            }
        });

        delete order.shippingAddressId;

        delete order.billingAddressId;

        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    order: order,
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

const cancelOrder = async (req, res, next) => {
    try {
        const orderDetails = await joiOrder.cancelOrderSchema.validateAsync(req.body);

        const order = await OrderModel.findOne({
            where: {
                id: orderDetails.orderId,
                isDeleted: false
            }
        });

        order.status = "Canceled";

        await order.save();

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
    cancelOrder
}