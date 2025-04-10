import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['general', 'recyclable', 'organic', 'hazardous']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'assigned', 'on_the_way', 'completed', 'cancelled', 'missed'],
    default: 'pending'
  },
  address: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    required: true
  },
  weight:{
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

const Request = mongoose.model("Request", requestSchema);
export default Request;