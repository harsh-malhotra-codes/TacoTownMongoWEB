const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const menuData = require('./menu-data');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= ROUTES ================= */

app.get('/api/menu', (req, res) => {
    res.json({ success: true, data: menuData });
});

/* ---------- CREATE ORDER ---------- */
app.post('/api/orders', async (req, res) => {
    try {
        const {
            orderId,
            customerName,
            customerEmail,
            customerPhone,
            customerPincode,
            customerAddress,
            customerLandmark,
            orderItems,
            totalAmount
        } = req.body;

        const status = req.body.status || 'confirmed';

        if (!orderId || !customerName || !orderItems || !totalAmount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const createdOrder = await Order.create({
            order_id: orderId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_pincode: customerPincode,
            customer_address: customerAddress,
            customer_landmark: customerLandmark,
            order_items: orderItems,
            total_amount: totalAmount,
            status: status
        });

        /* ===== SUCCESS LOG ===== */
        console.log('\n==============================');
        console.log('🟢 NEW ORDER SAVED');
        console.log('Order ID:', createdOrder.order_id);
        console.log('Customer:', createdOrder.customer_name);
        console.log('Amount:', createdOrder.total_amount);
        console.log('Time:', new Date().toISOString());
        console.log('Saved to MongoDB successfully');
        console.log('==============================\n');

        res.status(201).json({
            success: true,
            message: 'Order saved successfully',
            data: [createdOrder]
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Order ID already exists' });
        }

        console.error('\n==============================');
        console.error('🔴 FAILED TO SAVE ORDER');
        console.error(error.message);
        console.error('Time:', new Date().toISOString());
        console.error('==============================\n');

        res.status(500).json({ success: false, message: 'Failed to save order' });
    }
});

/* ---------- GET ORDERS ---------- */
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ created_at: -1 });

        console.log(`📦 Orders fetched: ${orders.length}`);

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('MongoDB error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

/* ---------- UPDATE ORDER ---------- */
app.put('/api/orders/:orderId', async (req, res) => {
    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { order_id: req.params.orderId },
            { status: req.body.status },
            { new: true }
        );

        if (!updatedOrder)
            return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({ success: true, message: 'Order updated', data: [updatedOrder] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update order' });
    }
});

/* ---------- DELETE ORDER ---------- */
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
        const deletedOrder = await Order.findOneAndDelete({ order_id: req.params.orderId });

        if (!deletedOrder)
            return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete order' });
    }
});

/* ---------- STATIC FILES ---------- */

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '../public', 'index.html'))
);

app.get('/admin.html', (req, res) =>
    res.sendFile(path.join(__dirname, '../public', 'admin.html'))
);

/* ================= SERVER START FIRST ================= */

app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});

/* ================= MONGODB CONNECTION (BACKGROUND) ================= */

mongoose.connection.on('connected', () => console.log('🟢 MongoDB Connected'));
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB Disconnected'));
mongoose.connection.on('reconnected', () => console.log('🟡 MongoDB Reconnected'));
mongoose.connection.on('error', err => console.log('🔴 MongoDB Error:', err.message));

(async function connectMongo() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI missing in Render Environment Variables');
        return;
    }

    try {
        console.log('🟡 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Database ready for operations');
    } catch (err) {
        console.error('🔴 MongoDB connection failed:', err.message);
    }
})();