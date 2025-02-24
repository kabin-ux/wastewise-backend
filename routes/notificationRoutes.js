import { Router } from 'express';
import { Admin } from '../models/adminModel.js';
import { Notification } from '../models/notificationModel.js';
import { verifyJWT } from '../middlewares/auth.js';

const router = Router();

router.post('/', verifyJWT, async (req, res) => {
    try {
        const { recipientType, title, message, type, data } = req.body;
        console.log('Received notification request:', { recipientType, title, message, type });
        
        // If recipient type is admin, send to all admins
        if (recipientType === 'admin') {
            // Find all admin users
            const admins = await Admin.find({});
            console.log('Found admins:', admins.length);
            
            if (admins.length === 0) {
                throw new Error('No admin users found');
            }
            
            // Create notifications for each admin
            const notifications = await Promise.all(
                admins.map(admin => 
                    Notification.create({
                        recipient: admin._id,
                        title,
                        message,
                        type,
                        data
                    })
                )
            );
            
            console.log('Created notifications:', notifications.length);
            
            return res.json({
                StatusCode: 200,
                IsSuccess: true,
                Result: notifications,
                Message: 'Notifications sent successfully'
            });
        }
        
        // Handle other recipient types...
        res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            ErrorMessage: 'Invalid recipient type',
            Result: null
        });
        
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message,
            Result: null
        });
    }
});

// Add a route to fetch admin notifications
router.get('/admin', verifyJWT, async (req, res) => {
    try {
        const adminId = req.user._id; // Get admin ID from JWT token
        const notifications = await Notification.find({ 
            recipient: adminId,
            type: 'NEW_COMPLAINT' 
        }).sort({ createdAt: -1 });
        
        res.json({
            StatusCode: 200,
            IsSuccess: true,
            Result: notifications,
            Message: 'Notifications fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message,
            Result: null
        });
    }
});

export default router; 