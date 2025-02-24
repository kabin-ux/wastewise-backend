import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import Driver from '../models/driverModel.js';
import Token from '../models/emailToken.js';
import crypto from 'crypto';
import { BASE_URL } from '../config.js';
import { sendEmail } from '../utils/sendVerificationEmail.js';
import DriverToken from '../models/driverToken.js';
import { cloudinary } from '../config/cloudinary.js';
import streamifier from 'streamifier';


// Get all drivers
export const getAllDrivers = async (req, res, next) => {
    try {
        const drivers = await Driver.find();

        if (!drivers || drivers.length === 0) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Drivers not found',
                Result: []
            });
        }

        return res.status(200).json({
            drivers,
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Drivers found successfully",
                drivers,
            },
            ErrorMessage: [],
        });
    } catch (err) {
        console.error("Error occured", err);

        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to retrieve drivers, Server Error",
            Result: [],
        }); // Error handling
    }
};

//Get Current Driver
export const getCurrentDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.userId);

        if (!driver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Driver not found",
                Result: [],
            });
        }

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            ErrorMessage: [],
            Result: {
                driver: driver,
                Message: "Current driver fetched successfully"
            },
        });
    } catch (err) {
        console.error("Error occurred", err);

        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Server error",
            Result: [],
        });
    }
};

// Data insert
export const addDrivers = async (req, res, next) => {
    const { firstName, lastName, dateOfBirth, email, address, phoneNumber, nationality, licenseNumber, password, confirmPassword } = req.body;

    // Validate phone number using a regex (example for valid Nepali phone numbers)
    const phoneRegex = /^[0-9]{10}$/;  // This is a simple regex for a 10-digit phone number
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            ErrorMessage: "Invalid phone number format. It should be a 10-digit number.",
            Result: [],
        });
    }

    if (password !== confirmPassword) {
        return res.status(409).json({
            StatusCode: 409,
            IsSuccess: false,
            ErrorMessage: "Passwords do not match",
            Result: [],
        });
    }

    try {
        const existingDriver = await Driver.findOne({ email });

        if (existingDriver) {
            return res.status(409).json({
                StatusCode: 409,
                IsSuccess: false,
                ErrorMessage: "Driver with this email already exists",
                Result: [],
            });
        }

        const driver = await Driver.create({ firstName, lastName, dateOfBirth, email, address, phoneNumber, nationality, licenseNumber, password, confirmPassword });

        // Sending Verification Email
        const token = await DriverToken.create({
            userId: driver._id,
            token: crypto.randomBytes(32).toString("hex"),
        });

        const url = `${BASE_URL}/drivers/${driver._id}/verify/${token.token}`;

        await sendEmail(driver.email, "Verify Email", url);

        // Adjusted response
        return res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            Message: "Driver created successfully! Verification Email has been sent",
            driver: driver, // Send the driver data directly
            ErrorMessage: [],
        });
    } catch (err) {
        console.error("Error occurred", err);

        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to add driver, Server Error",
            Result: [],
        }); // Error handling
    }
};


// Get driver by ID
export const getById = async (req, res, next) => {
    const { did } = req.params;

    try {
        const driver = await Driver.findById(did);
        if (!driver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Driver of the id provided not found',
                Result: []
            });
        }
        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Driver of the id provided found successfully",
                driver,
            },
            ErrorMessage: [],
        });
    } catch (err) {
        console.error("Error occured", err);

        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to retrieve driver, Server Error",
            Result: [],
        }); // Error handling
    }
};

export const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                StatusCode: 400,
                IsSuccess: false,
                Message: "No image file provided",
                ErrorMessage: ["Please select an image to upload"],
                Result: []
            });
        }

        const uploadFromBuffer = async (buffer) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'driver-profile-images',
                        allowed_formats: ['jpg', 'png', 'jpeg'],
                        transformation: [{ width: 500, height: 500, crop: 'fill' }]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(buffer).pipe(uploadStream);
            });
        };

        const result = await uploadFromBuffer(req.file.buffer);

        // Update driver profile with new image URL
        const updatedDriver = await Driver.findByIdAndUpdate(
            req.params.did,
            {
                profileImage: {
                    public_id: result.public_id,
                    url: result.secure_url
                }
            },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Driver not found",
                ErrorMessage: [],
                Result: []
            });
        }

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Profile image uploaded successfully",
            Result: {
                imageUrl: result.secure_url,
                public_id: result.public_id
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Failed to upload image",
            ErrorMessage: [error.message],
            Result: []
        });
    }
};

// Update the updateDriver function to handle image updates properly
export const updateDriver = async (req, res, next) => {
    const { did } = req.params;
    const { firstName, lastName, dateOfBirth, email, address, phoneNumber, nationality, licenseNumber, password } = req.body;

    try {
        const updateDriverData = {
            firstName,
            lastName,
            dateOfBirth,
            email,
            address,
            phoneNumber,
            nationality,
            licenseNumber
        };

        // Handle profile image upload
        if (req.file) {
            // If user already has a profile image, delete it from Cloudinary
            const driver = await Driver.findById(did);
            if (driver?.profileImage?.public_id) {
                await cloudinary.uploader.destroy(driver.profileImage.public_id);
            }

            // Add new profile image data
            updateDriverData.profileImage = {
                public_id: req.file.filename,
                url: req.file.path
            };
        }

        // Handle password update if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateDriverData.password = await bcrypt.hash(password, salt);
        }

        // Find and update the driver
        const updatedDriver = await Driver.findByIdAndUpdate(
            did,
            updateDriverData,
            { new: true, runValidators: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Driver not found',
                Result: []
            });
        }

        // Remove password from response
        const userResponse = updatedDriver.toObject();
        delete userResponse.password;

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Driver updated successfully",
                UpdatedDriver: userResponse
            },
            ErrorMessage: []
        });
    } catch (err) {
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to update driver, Server Error",
            Result: []
        });
    }
};

// Delete driver
export const deleteDriver = async (req, res, next) => {
    const { did } = req.params;

    try {
        const driver = await Driver.findByIdAndDelete(did);
        if (!driver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Driver not found',
                Result: []
            });
        }
        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Driver deleted successfully",
                driver
            },
            ErrorMessage: [],
        });
    } catch (err) {
        console.error("Error occured", err);
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to delete driver, Server Error",
            Result: [],
        }); // Error handling
    }
};

// Login driver
export const loginDriver = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await Driver.findOne({ email });
        if (!user) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Driver not found',
                Result: []
            });
        }

        // Validate password (assuming you have a method isPasswordCorrect)
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                errorMessage: "Invalid user credentials",
            });
        }

        // Generate token with user ID and type
        const userType = "driver"; // Define based on user model, or derive based on the table
        const accessToken = generateAccessToken(user._id, userType);
        const refreshToken = generateRefreshToken(user._id, userType);

        return res.status(200).json({
            user,
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Driver found successfully",
                user
            },
            ErrorMessage: [],
            accessToken, refreshToken
        });
    } catch (err) {
        console.error("Error occured", err)
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Unable to retrieve requests, Server Error",
            Result: [],
        });
    }
};


export const verifyEmail = async (req, res) => {
    const { did, token } = req.params;

    try {
        const driver = await Driver.findOne({ _id: did });

        if (!driver) {
            return res.status(400).json({
                Message: "Invalid Link as no user"
            })
        }
        const userToken = await DriverToken.findOne({
            userId: driver._id,
            token: token
        })

        if (!userToken) {
            return res.status(400).json({
                Message: "Invalid Link as no token"
            })
        }

        await Driver.updateOne(
            { _id: driver._id },
            { $set: { verified: true } }
        );
        await Token.deleteOne({ _id: userToken._id });

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Email verified successfully",
        })
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Internal Server Errorrrrr",
            Result: []
        })
    }
};

export const updateDriverStatus = async (req, res) => {
    const { did } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            ErrorMessage: "isActive must be a boolean value",
            Result: []
        });
    }

    try {
        const driver = await Driver.findByIdAndUpdate(
            did,
            { isActive },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: 'Driver not found',
                Result: []
            });
        }
        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Result: {
                Message: "Driver status updated successfully",
                driver
            },
            ErrorMessage: [],
        });

    }
    catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Internal Server Error",
            Result: []
        })
    }

}