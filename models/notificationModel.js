import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: false // Optional for broadcast notifications
    },
    recipientModel: {
        type: String,
        enum: ['User', 'Admin', 'Driver'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'NEW_REQUEST',
            'DRIVER_ON_THE_WAY',
            'REQUEST_CANCELLED',
            'REQUEST_COMPLETED',
            'COLLECTION_MISSED',
            'DRIVER_ASSIGNED',
            'COLLECTION_REMINDER',
            "USER_FEEDBACK",
            'RECYCLING_UPDATE',
            'ADMIN_ANNOUNCEMENT',
            'SYSTEM_ALERT'
        ],
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from creation
    }
});

// Index for faster queries and automatic deletion of expired notifications
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ recipient: 1, recipientModel: 1, isRead: 1 });

// Add a method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    return this.save();
};

// Static method to create a notification for multiple recipients
notificationSchema.statics.createForRecipients = async function(recipients, notificationData) {
    const notifications = recipients.map(recipient => ({
        ...notificationData,
        recipient: recipient._id,
        recipientModel: recipient.constructor.modelName
    }));
    
    return this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;