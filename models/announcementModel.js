import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    audience: {
      type: String,
      enum: ['all', 'user', 'drivers'], // customize based on roles in your system
      default: 'all',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    visibleUntil: {
      type: Date,
    },
  });

  const Announcement = mongoose.model('Announcement', announcementSchema);
  export default Announcement;