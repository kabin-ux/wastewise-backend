import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config/config.js";

// First, drop the existing index if it exists
try {
  await mongoose.connection.collection('users').dropIndex('fcmTokens_1');
} catch (err) {
  // Index might not exist, continue
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false
  },
  profileImage: {
    public_id: String,
    url: String
  },
  fcmTokens: {
    type: [String],
    default: undefined,
    set: function(tokens) {
      if (!tokens) return undefined;
      if (!Array.isArray(tokens)) return [tokens].filter(Boolean);
      return tokens.filter(Boolean);
    }
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

// Password Encryption
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Check Password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function (userId, userType) {
  return jwt.sign(
    {
      userId,
      userType
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10d"
    }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function (userId, userType) {
  return jwt.sign(
    {
      userId,
      userType
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "10d"
    }
  );
};

// Add method to safely add FCM token
userSchema.methods.addFcmToken = function(token) {
  if (!token) return;
  if (!this.fcmTokens) this.fcmTokens = [];
  if (!this.fcmTokens.includes(token)) {
    this.fcmTokens.push(token);
  }
};

// Add method to safely remove FCM token
userSchema.methods.removeFcmToken = function(token) {
  if (!token || !this.fcmTokens) return;
  this.fcmTokens = this.fcmTokens.filter(t => t !== token);
};

// Remove all indexes first
userSchema.indexes().forEach(async (index) => {
  try {
    await mongoose.connection.collection('users').dropIndex(index[0]);
  } catch (err) {
    // Index might not exist, continue
  }
});

// Add only the email unique index
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

// Ensure indexes are created properly
User.createIndexes().catch(console.error);

export default User;
