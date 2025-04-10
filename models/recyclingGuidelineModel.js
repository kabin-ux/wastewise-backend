import mongoose from "mongoose";

const recyclingGuidelineSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['recyclable', 'hazardous', 'organic']
  },
  title: {
    type: String,
    required: true
  },
  items: [{
    type: String,
    required: true
  }],
  tips: [{
    type: String
  }],
}, {
  timestamps: true
});

export const RecyclingGuideline = mongoose.model("RecyclingGuideline", recyclingGuidelineSchema);