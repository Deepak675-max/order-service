const mongoose = require("mongoose");

const shippingAddressSchema = new mongoose.Schema({
    recipientsName: {
        type: String,
    },
    streetAddressLine: {
        type: String,
        require: true
    },
    city: {
        type: String,
        require: true,
    },
    state: {
        type: String,
        require: true
    },
    country: {
        type: String,
        require: true
    },
    postalCode: {
        type: Number,
        require: true
    }
})

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        require: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    amount: { type: Number },
    status: {
        type: String,
        enum: ["pending", "shipped", "confirmed", "canceled"],
        default: "pending"
    },
    shippingAddress: {
        type: shippingAddressSchema,
        require: true
    },
    items: [
        {
            product: {
                _id: { type: mongoose.Schema.Types.ObjectId, require: true },
                name: { type: String },
                description: { type: String },
                image: { type: String },
                category: { type: String },
                unit: { type: Number },
                price: { type: Number },
                suplier: { type: mongoose.Schema.Types.ObjectId },
            },
            unit: { type: Number, require: true }
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Order', orderSchema);