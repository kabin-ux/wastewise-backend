import { getIdFromToken } from "../middlewares/auth.js";
import Announcement from "../models/announcementModel.js";

export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, audience, visibleUntil } = req.body;
        const newAnnouncement = new Announcement({
            title,
            message,
            audience,
            createdBy: req.user.id,
            visibleUntil,
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
            ErrorMessage: "Error creating announcement", error: err.message
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
        const announcements = await Announcement.find({audience: 'user'}).sort({ createdAt: -1 });

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

export const getDriverAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({audience: 'driver'}).sort({ createdAt: -1 });

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

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, audience, visibleUntil } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { title, message, audience, visibleUntil },
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

