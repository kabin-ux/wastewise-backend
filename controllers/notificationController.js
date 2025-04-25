import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import Driver from '../models/driverModel.js';
import { messaging } from '../config/firebase-admin-config.js';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import mongoose from 'mongoose';


// Function to create notification without HTTP context
export const createNotificationInternal = async (notificationData) => {
    try {
        const { recipientType, recipient, title, message, type, data } = notificationData;

        if (!recipientType || !title || !message) {
            throw new Error('Missing required notification fields');
        }

        // Capitalize first letter for recipientModel
        const recipientModel = recipientType.charAt(0).toUpperCase() + recipientType.slice(1);

        let Model, targetUser;
        switch (recipientType.toLowerCase()) {
            case 'admin':
                Model = Admin;
                targetUser = await Admin.find({});
                break;
            case 'user':
                Model = User;
                if (!recipient) throw new Error('Recipient user ID is required');
                targetUser = await User.findById(recipient);
                break;
            case 'driver':
                Model = Driver;
                if (!recipient) throw new Error('Recipient driver ID is required');
                targetUser = await Driver.findById(recipient);
                break;
            default:
                throw new Error('Invalid recipient type');
        }

        if (!targetUser || (Array.isArray(targetUser) && targetUser.length === 0)) {
            throw new Error('No recipients found');
        }

        // Create notification records
        const notifications = Array.isArray(targetUser)
            ? await Promise.all(targetUser.map(user =>
                Notification.create({
                    recipient: user._id,
                    recipientModel,
                    title,
                    message,
                    type,
                    data,
                    isRead: false,
                    createdAt: new Date()
                })
            ))
            : [await Notification.create({
                recipient: targetUser._id,
                recipientModel,
                title,
                message,
                type,
                data,
                isRead: false,
                createdAt: new Date()
            })];

        // Collect and validate FCM tokens
        let fcmTokens = Array.isArray(targetUser)
            ? targetUser.reduce((tokens, user) => [...tokens, ...(user.fcmTokens || [])], [])
            : targetUser.fcmTokens || [];

        // Filter out invalid tokens
        fcmTokens = fcmTokens.filter(token =>
            token &&
            typeof token === 'string' &&
            token.length > 0 &&
            token.includes(':')
        );

        // Remove duplicates
        fcmTokens = [...new Set(fcmTokens)];

        if (fcmTokens.length > 0) {
            const pushMessage = {
                notification: {
                    title,
                    body: message
                },
                data: {
                    type: type || 'GENERAL',
                    notificationId: notifications[0]._id.toString(),
                    ...(data ? JSON.parse(JSON.stringify(data)) : {}),
                    timestamp: new Date().toISOString()
                },
                tokens: fcmTokens
            };

            try {
                const response = await messaging.sendEachForMulticast(pushMessage);

                if (response.failureCount > 0) {
                    const failedTokens = response.responses
                        .map((resp, idx) => !resp.IsSucces ? fcmTokens[idx] : null)
                        .filter(Boolean);

                    if (failedTokens.length > 0) {
                        await cleanupFailedTokens(failedTokens, recipientType.toLowerCase(), recipient);
                    }
                }
            } catch (fcmError) {
                console.error('FCM error:', {
                    message: fcmError.message,
                    code: fcmError.code,
                    stack: fcmError.stack
                });
            }
        } else {
            console.error('No valid FCM tokens found for notification recipients');
        }

        return notifications.length === 1 ? notifications[0] : notifications;

    } catch (error) {
        console.error('Notification creation error:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// HTTP route handler for creating notifications
export const createNotification = async (req, res) => {
    try {
        const notification = await createNotificationInternal(req.body);
        res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            notification,
            Message: "Notification created successfully"
        });
    } catch (error) {
        console.error("Notification creation error:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            error: error.message
        });
    }
};

export const respondToNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // "accept" or "decline"

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({
                StatusCode: 400,
                IsSuccess: false,
                Message: "Invalid action. Use 'accept' or 'decline'."
            });
        }

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Notification not found"
            });
        }

        notification.status = action === 'accept' ? 'accepted' : 'declined';
        await notification.save();

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: `Notification ${action}ed successfully`,
            notification
        });

    } catch (error) {
        console.error("Error responding to notification:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to respond to notification"
        });
    }
};


export const sendRequestStatusNotification = async (request, newStatus) => {
    try {
        const notificationTypes = {
            'on-the-way': {
                type: 'DRIVER_ON_THE_WAY',
                title: 'Driver On The Way',
                message: 'Your waste collection driver is on the way.'
            },
            'cancelled': {
                type: 'REQUEST_CANCELLED',
                title: 'Request Cancelled',
                message: 'Your waste collection request has been cancelled.'
            },
            'completed': {
                type: 'REQUEST_COMPLETED',
                title: 'Collection Completed',
                message: 'Your waste collection has been completed successfully.'
            },
            'missed': {
                type: 'COLLECTION_MISSED',
                title: 'Collection Missed',
                message: 'Your scheduled collection was marked as missed.'
            }
        };

        const notificationConfig = notificationTypes[newStatus];
        if (!notificationConfig) return;

        const notificationData = {
            recipientType: 'user',
            recipient: request.userId,
            title: notificationConfig.title,
            message: notificationConfig.message,
            type: notificationConfig.type,
            data: {
                requestId: request._id.toString(),
                status: newStatus,
                driverId: request.driverId,
                scheduledDate: request.scheduledDate
            }
        };

        await createNotificationInternal(notificationData);

    } catch (error) {
        console.error('Failed to send status notification:', error);
    }
};

// Helper function to cleanup failed tokens
const cleanupFailedTokens = async (failedTokens, recipientType, recipient) => {
    try {
        const updateQuery = { $pull: { fcmTokens: { $in: failedTokens } } };

        if (recipientType === 'admin') {
            await Admin.updateMany({}, updateQuery);
        } else {
            const Model = recipientType === 'user' ? User : Driver;
            await Model.findByIdAndUpdate(recipient, updateQuery);
        }

    } catch (error) {
        console.error('Token cleanup error:', error);
    }
};


// Get notifications for a specific user/driver
export const getNotifications = async (req, res) => {
    try {

        const notifications = await Notification.find({
            $or: [
                { recipient: req.user.userId, recipientModel: 'User' },
                { recipientModel: 'User', recipient: null } // Broadcast notifications
            ]
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            notifications: notifications || []
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to retrieve notifications",
            notifications: []
        });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.recipient.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                StatusCode: 403,
                IsSuccess: false,
                Message: "Not authorized to access this notification"
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            StatusCode: 200,
            IsSucces: true,
            Message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to mark notification as read"
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.userId,
                isRead: false
            },
            { isRead: true }
        );

        res.status(200).json({
            StatusCode: 200,
            IsSucces: 200,
            Message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSucces: false,
            Message: "Failed to mark all notifications as read"
        });
    }
};

// Delete a specific notification
export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;

        // Validate notification ID
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                IsSuccess: false,
                message: "Invalid notification ID"
            });
        }

        // Find the notification
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Notification not found"
            });
        }

        // Check if the user has permission to delete this notification
        if (notification.recipient &&
            notification.recipient.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                StatusCode: 403,
                IsSuccess: false,
                Message: "Not authorized to delete this notification"
            });
        }

        // Delete the notification
        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Notification deleted IsSuccessfully"
        });

    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Failed to delete notification",
            error: error.message
        });
    }
};

export const registerDevice = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.userId;
        const userType = req.user.userType;

        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token is required' });
        }

        let Model;
        switch (userType.toLowerCase()) {
            case 'admin':
                Model = Admin;
                break;
            case 'user':
                Model = User;
                break;
            case 'driver':
                Model = Driver;
                break;
            default:
                return res.status(400).json({ error: 'Invalid user type' });
        }

        // Find current user
        const user = await Model.findById(userId);
        if (!user) {
            return res.status(404).json({ error: `${userType} not found` });
        }

        // Ensure fcmTokens array is initialized
        if (!Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
        }

        // Clean up old/duplicate tokens for this user
        user.fcmTokens = user.fcmTokens.filter(token =>
            token && token.includes(':') && token !== fcmToken
        );

        // Add new token
        user.fcmTokens.push(fcmToken);

        // Verify token with Firebase
        try {
            const testMessage = {
                notification: {
                    title: 'Device Registration',
                    body: 'Testing device registration'
                },
                token: fcmToken
            };

            await messaging.send(testMessage);

            // Save user only after successful verification
            await user.save();

            return res.status(200).json({
                StatusCode: 200,
                IsSuccess: true,
                message: 'Device registered successfully',
                tokens: user.fcmTokens
            });

        } catch (firebaseError) {
            console.error('Firebase token verification failed:', firebaseError);
            return res.status(400).json({
                StatusCode: 400,
                IsSuccess: false,
                ErrorMessage: 'Invalid FCM token',
                details: firebaseError.message
            });
        }

    } catch (error) {
        console.error('Device registration error:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: 'Failed to register device',
            details: error.message
        });
    }
};

export const sendTestNotification = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.fcmTokens?.length) {
            return res.status(400).json({
                error: 'No FCM tokens registered for this user'
            });
        }

        const message = {
            notification: {
                title: 'WasteWise Test Notification',
                body: 'This is a test notification from WasteWise'
            },
            data: {
                type: 'TEST',
                timestamp: new Date().toISOString()
            },
            tokens: user.fcmTokens
        };

        try {
            const response = await messaging.sendEachForMulticast(message);

            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.IsSuccess) {
                        failedTokens.push(user.fcmTokens[idx]);
                    }
                });

                if (failedTokens.length > 0) {
                    await User.findByIdAndUpdate(userId, {
                        $pull: { fcmTokens: { $in: failedTokens } }
                    });
                }
            }

            res.status(200).json({
                StatusCode: 200,
                IsSucces: true,
                Message: 'Test notification sent',
                successCount: response.successCount,
                failureCount: response.failureCount
            });
        } catch (fcmError) {
            console.error('FCM Error:', fcmError);
            throw new Error(`FCM Error: ${fcmError.message}`);
        }
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSucces: false,
            ErrorMessage: 'Failed to send test notification',
            details: error.message
        });
    }
};

// Get notifications for admin
export const getAdminNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientModel: 'Admin'
        })
            .sort({ createdAt: -1 })
            .limit(50)
            // Add distinct by _id if needed
            .collation({ locale: 'en' })
            .exec();

        // Ensure unique notifications by ID
        const uniqueNotifications = Array.from(
            new Map(notifications.map(item => [item._id.toString(), item])).values()
        );

        res.status(200).json({
            StatusCode: 200,
            IsSucces: true,
            notifications: uniqueNotifications,
            Message: "Admin notifications retrieved successfully"
        });
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSucces: false,
            ErrorMessage: 'Failed to fetch notifications',
            notifications: []
        });
    }
};

// Get driver notifications
export const getDriverNotifications = async (req, res) => {
    try {
        const driverId = req.user.userId;

        // Find notifications where the driver is the recipient
        const notifications = await Notification.find({
            recipient: driverId,
            recipientModel: 'Driver'  // Add this to ensure we only get driver notifications
        })
            .sort({ createdAt: -1 }) // Sort by newest first
            .exec();


        res.status(200).json({
            StatusCode: 200,
            IsSucces: true,
            notifications: notifications,
            Message: "Driver notifications retrieved successfully"
        });
    } catch (error) {
        console.error('Error fetching driver notifications:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSucces: false,
            ErrorMessage: 'Failed to fetch notifications',
            error: error.message
        });
    }
};