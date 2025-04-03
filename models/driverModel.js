import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config/config.js";


const driverSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true
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
        required: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: "false"
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    verified: {
        type: Boolean
    },
    profileImage: {
        public_id: String,
        url: String
    },
    refreshToken: {
        type: String
    },
    fcmTokens: [{
        type: String
    }]
});

// Password Encryption
driverSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next()
});

// Check Password
driverSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};

// Generate Access Token
driverSchema.methods.generateAccessToken = function (userId, userType) {
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
driverSchema.methods.generateRefreshToken = function (userId, userType) {
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

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;