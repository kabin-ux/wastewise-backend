import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to User model
        required: true
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request", // Reference to Request model
        required: true
    },
    type: {
        type: String,
        enum: ['Suggestion', 'Late Pickup', 'Missed Pickup', 'Rude Staff', 'Inefficient Collection', 'Positive Experience'],
        default: 'Suggestion'
    },
    message: {
        type: String,
        required: [true, "Feedback message is required"],
        trim: true,
        minlength: [5, "Feedback must be at least 5 characters long"],
        maxlength: [500, "Feedback cannot exceed 500 characters"]
    },
    rating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Resolved'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    adminResponse: {
        type: String,
        trim: true,
        maxlength: [500, "Response cannot exceed 500 characters"],
        default: null
    },
    attachments: [{
        type: String // Store URLs of uploaded images/videos
    }],
    isAnonymous: {
        type: Boolean,
        default: false,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;