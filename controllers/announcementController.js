import { getIdFromToken } from "../middlewares/auth.js";
import Announcement from "../models/announcementModel.js";

export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, audience, startDate, endDate } = req.body;
        const currentDate = new Date();

        // Validate end date if provided
        if (endDate) {
            const endDateTime = new Date(endDate);
            if (endDateTime < currentDate) {
                return res.status(400).json({
                    StatusCode: 400,
                    IsSuccess: false,
                    ErrorMessage: "End date cannot be before current date"
                });
            }
        }

        // Validate start date and end date relationship if both provided
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            if (startDateTime > endDateTime) {
                return res.status(400).json({
                    StatusCode: 400,
                    IsSuccess: false,
                    ErrorMessage: "Start date cannot be after end date"
                });
            }
        }

        const newAnnouncement = new Announcement({
            title,
            message,
            audience,
            startDate,
            endDate,
            createdBy: req.user.id,
        });

        const saved = await newAnnouncement.save();
        res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            announcement: saved,
            Message: "Announcement created successfully",
        });
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error creating announcement",
            error: err.message
        });
    }
};

export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            announcements,
            Message: "Announcements retrieved Successfully"
        });
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error fetching announcement", error: err.message
        });
    }
};

export const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Error finding announcement"
            });
        }
        res.status(200).json(
            {
                StatusCode: 200,
                IsSuccess: true,
                Message: "Announcement fetched successfully"
            }
        );
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error fetching announcement", error: err.message
        });
    }
}

export const getUserAnnouncements = async (req, res) => {
    try {
        const currentDate = new Date();

        const announcements = await Announcement.find({
            // Audience filter
            $or: [
                { audience: 'user' },
                { audience: 'all' }
            ],
            // Active date range filter
            $and: [
                {
                    $or: [
                        { startDate: null },
                        { startDate: { $lte: currentDate } }
                    ]
                },
                {
                    $or: [
                        { endDate: null },
                        { endDate: { $gte: currentDate } }
                    ]
                }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            announcements,
            Message: "Active announcements retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error fetching announcements",
            error: err.message
        });
    }
};


export const getDriverAnnouncements = async (req, res) => {
    try {
        const now = new Date();

        const announcements = await Announcement.find({
            audience: { $in: ['drivers', 'all'] },
            $and: [
                {
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: null },
                        { startDate: { $lte: now } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gt: now } }
                    ]
                }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            StatusCode: 200,
            isSuccess: true,
            message: "Active announcements retrieved successfully.",
            announcements
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error retrieving announcements.",
            error: error.message
        });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, audience, } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { title, message, audience, },
            { new: true }
        );
        if (!announcement) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Announcement not found",
            });
        }
        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            announcement,
            Message: "Announcement updated successfully",
        });
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal server Error",
        });
    }
}

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);
        if (!announcement) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Error finding announcement", error: err.message
            });
        }
        res.status(200).json({
            StatusCode: 200,
            IsSuccess: false,
            Message: "Announcement deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Error deleting announcement", error: err.message
        });
    }
};

