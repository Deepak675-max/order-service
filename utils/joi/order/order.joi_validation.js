const joi = require('joi');

const createOrderSchema = joi.object({
    shippingAddress: joi.object({
        recipientsName: joi.string().trim().optional().default(null),
        streetAddressLine: joi.string().trim().required(),
        city: joi.string().trim().required(),
        state: joi.string().trim().required(),
        country: joi.string().trim().required(),
        postalCode: joi.number().required()
    }),
    paymentId: joi.string().trim().required(),
    isDeleted: joi.boolean().optional().default(false),
});

const getOrders = joi.object({
    status: joi.string().trim().optional().default(null),
    metaData: joi.object({
        orderBy: joi.string().trim().optional().default(null),
        orderDirection: joi.string().trim().optional().default(null),
        page: joi.number().optional().default(null),
        pageSize: joi.number().optional().default(null),
    }).optional().default(null)
})

const getUserOrderDetailsSchema = joi.object({
    userId: joi.number().integer().required(),
})

const cancelOrderSchema = joi.object({
    orderId: joi.number().integer().required(),
});

module.exports = {
    createOrderSchema,
    getOrders,
    getUserOrderDetailsSchema,
    cancelOrderSchema,

};
