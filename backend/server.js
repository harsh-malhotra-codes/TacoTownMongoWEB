const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const menuData = require('./menu-data');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT ? process.env.PORT : 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/menu', function (req, res) {
    res.json({ success: true, data: menuData });
});

app.post('/api/orders', async function (req, res) {
    try {
        const orderId = req.body.orderId;
        const customerName = req.body.customerName;
        const customerEmail = req.body.customerEmail;
        const customerPhone = req.body.customerPhone;
        const customerPincode = req.body.customerPincode;
        const customerAddress = req.body.customerAddress;
        const customerLandmark = req.body.customerLandmark;
        const orderItems = req.body.orderItems;
        const totalAmount = req.body.totalAmount;
        const status = req.body.status ? req.body.status : 'confirmed';

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

        console.log('==============================');
        console.log('NEW ORDER RECEIVED');
        console.log('Order ID: ' + createdOrder.order_id);
        console.log('Customer: ' + createdOrder.customer_name);
        console.log('Total Amount: ' + createdOrder.total_amount);
        console.log('Timestamp: ' + new Date().toISOString());
        console.log('Order saved to MongoDB successfully');
        console.log('==============================');

        return res.status(201).json({ success: true, message: 'Order saved successfully', data: [createdOrder] });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Order ID already exists' });
        }
        console.error('==============================');
        console.error('FAILED TO SAVE ORDER');
        console.error('Error: ' + error.message);
        console.error('Time: ' + new Date().toISOString());
        console.error('==============================');
        return res.status(500).json({ success: false, message: 'Failed to save order' });
    }
});

app.get('/api/orders', async function (req, res) {
    try {
        const orders = await Order.find({}).sort({ created_at: -1 });
        console.log('Admin requested orders list');
        console.log('Orders returned: ' + orders.length);
        console.log('Timestamp: ' + new Date().toISOString());
        return res.json({ success: true, data: orders });
    } catch (error) {
        console.error('MongoDB error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

app.put('/api/orders/:orderId', async function (req, res) {
    try {
        const orderId = req.params.orderId;
        const status = req.body.status;
        if (!status) { return res.status(400).json({ success: false, message: 'Status is required' }); }
        const updatedOrder = await Order.findOneAndUpdate({ order_id: orderId }, { status: status }, { new: true });
        if (!updatedOrder) { return res.status(404).json({ success: false, message: 'Order not found' }); }
        return res.json({ success: true, message: 'Order updated successfully', data: [updatedOrder] });
    } catch (error) {
        console.error('MongoDB error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update order' });
    }
});

app.delete('/api/orders/:orderId', async function (req, res) {
    try {
        const orderId = req.params.orderId;
        const deletedOrder = await Order.findOneAndDelete({ order_id: orderId });
        if (!deletedOrder) { return res.status(404).json({ success: false, message: 'Order not found' }); }
        return res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('MongoDB error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete order' });
    }
});

app.post('/contact', function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;
    if (!name || !email || !message) { return res.status(400).json({ success: false, message: 'All fields are required' }); }
    console.log('Contact form message from ' + name + ' (' + email + '): ' + message);
    return res.json({ success: true, message: 'Message received successfully! We will get back to you soon.' });
});

app.get('/health', function (req, res) {
    return res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/admin.html', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

mongoose.connection.on('connected', function () {
    console.log('Database state: connected');
});

mongoose.connection.on('disconnected', function () {
    console.warn('Database state: disconnected');
});

mongoose.connection.on('reconnected', function () {
    console.log('Database state: reconnected');
});

mongoose.connection.on('error', function (error) {
    console.error('Database state: error - ' + (error && error.message ? error.message : error));
});

async function connectMongo() {
    if (!process.env.MONGODB_URI) {
        console.error('\u274C MONGODB_URI not found in .env');
        process.exit(1);
    }

    console.log('\uD83D\uDFE1 Connecting to MongoDB...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected Successfully');
        console.log('Database Host: ' + mongoose.connection.host);
        console.log('Database Name: ' + mongoose.connection.name);
        console.log('Connection Time: ' + new Date().toISOString());
        console.log('\uD83D\uDCE6 Database connection established');
        app.listen(PORT, function () {
            console.log('\uD83D\uDE80 Server running on http://localhost:' + PORT);
        });
    } catch (error) {
        console.error('\uD83D\uDD34 MongoDB connection failed');
        console.error(error.message);
        process.exit(1);
    }
}

connectMongo();
