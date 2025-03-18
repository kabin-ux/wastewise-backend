import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    registerDevice,
    sendTestNotification,
    getAdminNotifications,
    getDriverNotifications,
    deleteNotification,
    respondToNotification
} from '../controllers/notificationController.js';

import { authorizeUserType, verifyJWT } from '../middlewares/auth.js';
import Notification from '../models/notificationModel.js';

const notificationRouter = express.Router();

// Core notification routes
notificationRouter.post('/', verifyJWT, createNotification);
notificationRouter.get('/user-notifications', verifyJWT, getNotifications);
notificationRouter.get('/driver-notifications', verifyJWT, getDriverNotifications);
notificationRouter.get('/admin-notifications', verifyJWT, authorizeUserType('admin'), getAdminNotifications);
notificationRouter.put('/:id/read', verifyJWT, markAsRead);
notificationRouter.put('/mark-all-read', verifyJWT, markAllAsRead);
notificationRouter.post('/:id/respond', respondToNotification);
notificationRouter.delete('/:id/delete', verifyJWT, deleteNotification);

// Device registration and test routes
notificationRouter.post('/register-device', verifyJWT, registerDevice);
notificationRouter.post('/test-notification', verifyJWT, sendTestNotification);

// Debug routes for development
notificationRouter.post('/test-admin-notification', verifyJWT, async (req, res) => {
    try {
        const notification = await Notification.create({
            title: 'Test Admin Notification',
            message: 'This is a test notification for admins',
            type: 'NEW_REQUEST',
            recipientModel: 'Admin',
            isRead: false,
            data: {
                requestId: '123',
                status: 'pending'
            }
        });

        res.json({
            success: true,
            message: 'Test admin notification created',
            notification
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test route for user notifications
notificationRouter.post('/test-user-notification/:userId', verifyJWT, async (req, res) => {
    try {
        const notification = await createNotification({
            recipientType: 'user',
            recipient: req.params.userId,
            title: 'Test User Notification',
            message: 'This is a test notification for user',
            type: 'DRIVER_ASSIGNED',
            data: {
                requestId: '123',
                driverId: '456',
                status: 'assigned'
            }
        });

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route to check notifications for a specific user
notificationRouter.get('/check-user-notifications/:userId', verifyJWT, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipient: req.params.userId, recipientModel: 'User' },
                { recipientModel: 'User', recipient: null } // Broadcast notifications
            ]
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this route to check all notifications in the system
notificationRouter.get('/debug/all-notifications', verifyJWT, async (req, res) => {
    try {
        const allNotifications = await Notification.find({}).sort({ createdAt: -1 });
        const userNotifications = await Notification.find({ recipientModel: 'User' });
        const adminNotifications = await Notification.find({ recipientModel: 'Admin' });
        
        res.json({
            success: true,
            counts: {
                total: allNotifications.length,
                user: userNotifications.length,
                admin: adminNotifications.length
            },
            notifications: {
                all: allNotifications,
                user: userNotifications,
                admin: adminNotifications
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default notificationRouter;
