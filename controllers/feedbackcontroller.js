import { getIdFromToken, getRoleFromToken } from "../middlewares/auth.js";
import Feedback from "../models/feedbackModel.js";
import User from "../models/userModel.js";

// Get all Feedbacks
export const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate('userId', 'firstName lastName email profileImage').populate('requestId', 'type').lean() //Optimized Query;

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            feedbacks,
            Message: "Feedbacks retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: error.message
        });
    }
};

// Create new Feedback
export const createFeedback = async (req, res) => {
    const { type, message, rating, requestId, isAnonymous } = req.body;

    // Validate required fields
    if (!type || !message || !rating || !requestId) {
        return res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            Message: "Type, message, rating and requestId are required.",
        });
    }

    try {

        const user = await User.findById(req.user.userId)
            .select('firstName lastName')
            .lean();

        const fullName = user ? `${user.firstName} ${user.lastName}` : "Anonymous";

        // Create the Feedback in the database
        const feedback = await Feedback.create({
            userId: req.user.userId, // User ID from authentication middleware,
            userName: fullName,
            type, message, rating, requestId, isAnonymous: isAnonymous || false, // Defaults to false

        });

        // Send success response
        res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            feedback,
            Message: "FeedbacK created successfully"
        });
    } catch (error) {
        console.error("Error creating Feedback:", error);

        // Send error response
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to create the Feedback. Please try again later.",
        });
    }
};


export const updateFeedback = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                StatusCode: 401,
                IsSuccess: false,
                Message: "Unauthorized: No token provided",
            });
        }

        const userId = getIdFromToken(token);
        const userRole = getRoleFromToken(token);
        const { id } = req.params;


        const existingFeedback = await Feedback.findById(id);
        if (!existingFeedback) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Feedback not found",
            });
        }

        // if (existingFeedback.userId.toString() !== userId && userRole !== "admin") {
        //     return res.status(403).json({
        //         StatusCode: 403,
        //         IsSuccess: false,
        //         Message: "Access Forbidden: You can only update your own feedback",
        //     });
        // }

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            feedback: updatedFeedback,
            Message: "Feedback Updated Successfully",
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: error.message,
        });
    }
};



export const getUserFeedbacks = async (req, res) => {
    const token = req.header('Authorization')?.split(' ')[1];

    // Validate token presence
    if (!token) {
        return res.status(401).json({
            StatusCode: 401,
            IsSuccess: false,
            Message: "Unauthorized: No token provided",
        });
    }

    try {
        const userId = getIdFromToken(token); // Extract the user ID

        const feedbacks = await Feedback.find({
            userId: userId,
        }).populate('requestId', 'type').lean();

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            feedbacks,
            Message: "Feedbacks of the User retrieved Successfully"
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: error.message,
        });
    }
};


// Delete Feedback
export const deleteFeedback = async (req, res) => {
    const token = req.header('Authorization')?.split(' ')[1];

    // Validate token presence
    if (!token) {
        return res.status(401).json({
            StatusCode: 401,
            IsSuccess: false,
            Message: "Unauthorized: No token provided",
        });
    }
    try {
        const userId = getIdFromToken(token); // Extract the user ID
        const userRole = getRoleFromToken(token);
        const { id } = req.params;

        // Find feedback by ID
        const feedback = await Feedback.findById(id);

        if (!feedback) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Feedback not found",
            });
        }

        // Delete feedback
        await Feedback.findByIdAndDelete(id);

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Feedback deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: error.message,
        });
    }
};

export const respondToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse, status } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Feedback not found",
            });
        }

        feedback.adminResponse = adminResponse;
        feedback.status = status;
        await feedback.save();

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            feedback,
            Message: "Admin response updated successfully",
        });
    } catch (error) {
        console.error("Error responding to feedback:", error);
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to respond to feedback.",
        });
    }
};