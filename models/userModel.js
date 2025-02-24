import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET } from "../config.js";

// Define the user schema
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
    required: true, // Assuming you're including password in the user model
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
    default: [],
    validate: {
      validator: function (tokens) {
        // Check for duplicates within the array
        return new Set(tokens).size === tokens.length;
      },
      message: 'Duplicate FCM tokens are not allowed'
    }
  },
  refreshToken: {
    type: String
  }
},
  {
    timestamps: true
  }
);


// Password Encryption
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next()
});

// Check Password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
};

// Generate Access Token
userSchema.methods.generateAccessToken = function (userId, userType) {
  return jwt.sign(
    {
      userId, userType
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10d"
    }
  )
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function (userId, userType) {
  return jwt.sign(
    {
      userId, userType
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "10d"
    }
  )
};

// Remove any existing index on fcmTokens
userSchema.index({ fcmTokens: 1 }, { unique: false, sparse: true, background: true });

const User = mongoose.model("User", userSchema);
export default User;