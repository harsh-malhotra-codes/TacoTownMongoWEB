const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        id: String,
        name: String,
        price: Number,
        quantity: Number
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        order_id: { type: String, required: true, unique: true },
        customer_name: String,
        customer_email: String,
        customer_phone: String,
        customer_pincode: String,
        customer_address: String,
        customer_landmark: String,
        order_items: [orderItemSchema],
        total_amount: Number,
        status: {
            type: String,
            enum: ['confirmed', 'delivered'],
            default: 'confirmed'
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    },
    { versionKey: false }
);

module.exports = mongoose.model('Order', orderSchema);
