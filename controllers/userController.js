import { BASE_URL, REFRESH_TOKEN_SECRET } from "../config/config.js";
import mongoose from "mongoose";
import Token from "../models/emailToken.js";
import User from "../models/userModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../utils/sendVerificationEmail.js";
import crypto from 'crypto';
import { cloudinary } from '../config/cloudinary.js';
import streamifier from 'streamifier';


// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    if (!users.length) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "No users found",
        Result: [],
      });
    }

    return res.status(200).json({
      users,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Users retrieved successfully",
      },
    });
  } catch (err) {
    console.error("Error occured", err); // Log the error for debugging
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};

// Add a new user
export const createUser = async (req, res, next) => {
  const { firstName, lastName, email, address, phoneNumber, password, confirmPassword } = req.body;

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        StatusCode: 409,
        IsSuccess: false,
        ErrorMessage: "User with this email already exists",
        Result: [],
      });
    }
    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      address,
      phoneNumber,
      password
    });

    //Sending Verification Email
    const token = await Token.create({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    })

    const url = `${BASE_URL}/${user._id}/verify/${token.token}`;

    await sendEmail(user.email, "Verify Email", url)

    return res.status(200).json({
      user,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Verificaion email sent successfully",
        user,
      },
    });

  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Unable to add user",
      Result: [],
    });
  }
};

// Get user by ID
export const getById = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const user = await User.findById(uid);

    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "User not found",
        Result: [],
      });
    }
    return res.status(200).json({
      StatusCode: 200,
      user,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "User fetched successfully",
      },
    });
  } catch (err) {
    console.error("Error occurred", err); // Log the error for debugging

    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};

//Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "User not found",
        Result: [],
      });
    }

    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        user: user,
        Message: "Current user fetched successfully"
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

// Update user details

export const updateUser = async (req, res, next) => {
  const { uid } = req.params;
  const { firstName, lastName, email, address, phoneNumber, password, NID } = req.body;

  try {
    // Prepare the data to update
    const updateData = { firstName, lastName, email, address, phoneNumber, NID };

    // Handle profile image upload
    if (req.file) {
      // If user already has a profile image, delete it from Cloudinary
      const user = await User.findById(uid);
      if (user?.profileImage?.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }

      // Add new profile image data
      updateData.profileImage = {
        public_id: req.file.filename,
        url: req.file.path
      };
    }

    // Handle password update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      uid,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        Message: "User not found or unable to update",
        ErrorMessage: [],
        Result: []
      });
    }

    // Remove password from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "User updated successfully",
        UpdatedUser: userResponse
      }
    });

  } catch (err) {
    console.error("Error occurred", err);
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Error occurred while updating user",
      Result: []
    });
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
            folder: 'user-profile-images',
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

    // Update user profile with new image URL
    await User.findByIdAndUpdate(req.params.uid, {
      profileImage: {
        public_id: result.public_id,
        url: result.secure_url
      }
    });

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


// Delete a user
export const deleteUser = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const user = await User.findByIdAndDelete(uid);

    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "User not found",
        Result: [],
      });
    }

    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "User deleted successfully",
        DeletedUser: user,
      },
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};

// User login

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        StatusCode: 400,
        IsSuccess: false,
        ErrorMessage: "User does not exist",
        Result: [],
      });
    }

    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        StatusCode: 401,
        IsSuccess: false,
        ErrorMessage: "Invalid user credentials",
        Result: [],
      });
    }

    if (!user.verified) {
      let token = await Token.findOne({ userId: user._id });

      if (!token) {
        token = await Token.create({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        });


        const url = `${BASE_URL}/users/${user._id}/verify/${token.token}`;

        // Send email
        try {
          await sendEmail(user.email, "Verify Email", url);

        } catch (emailError) {
          console.error("Error sending email:", emailError);
          return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Failed to send verification email",
            Result: [],
          });
        }
      }

      return res.status(400).json({
        StatusCode: 500,
        IsSuccess: true,
        Message: "An email has been sent",
      });
    }

    // Generate token with user ID and type
    const userType = "user";
    const accessToken = generateAccessToken(user._id, userType);
    const refreshToken = generateRefreshToken(user._id, userType);


    // Respond with the token
    res.status(200).json({
      user,
      StatusCode: 200,
      IsSuccess: true,
      Message: "Login successful",
      ErrorMessage: [],
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};


// Get User by ID
export const getUserById = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "User not found",
        Result: [],
      });
    }
    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Result: {
        Message: "User found",
        user,
      },
    });
  } catch (err) {
    console.error("Internal Server Error", err);
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};

export const logOutUser = async (req, res) => {
  try {
    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Result: {
        Message: "User logged out successfully",
      },
      Errormessage: [],
    });
  } catch (err) {
    console.error("Error occurred", err);
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const incomingToken = req.headers.authorization?.split(" ")[1];
    const incomingRefreshToken = incomingToken;

    if (!incomingRefreshToken) {
      return res.status(400).json({
        errorMEssage: "Unauthorized request"
      })
    }
    //verify tokens
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

    const currentTime = Math.floor(Date.now() / 1000);


    //check if refresh token expired or not
    if (decodedToken.exp < currentTime) {
      return res.status(400).json({
        errorMEssage: "Refresh token has expired"
      })
    }


    const user = await User.findById(decodedToken?.userId);

    const userType = decodedToken?.userType;

    if (!user) {
      res.status(400).json({
        errorMessage: "Invalid refresh token"
      })
    }

    const newAccessToken = await generateAccessToken(user._id, userType);

    return res.status(200).json({
      newAccessToken,
      message: "Access token refreshed"
    })

  } catch (error) {
    console.error("Error occured", error);
    res.status(401).json({
      ErrorMessage: "Invalid refresh token"
    })
  }
};


export const verifyEmail = async (req, res) => {
  const { uid, token } = req.params;

  try {
    // Cast the user ID to ObjectId for a valid query
    const userId = new mongoose.Types.ObjectId(uid);

    // Find the user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(400).json({
        Message: "Invalid Link: No user found"
      });
    }

    // Find the token for that user
    const userToken = await Token.findOne({
      userId: user._id,
      token: token
    });
    if (!userToken) {
      return res.status(400).json({
        Message: "Invalid Link: No valid token found"
      });
    }

    // Update user status to verified
    await User.updateOne({ _id: user._id }, { $set: { verified: true } });

    // Delete the token after successful verification
    await Token.deleteOne({ _id: userToken._id });

    // Success response
    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Email verified successfully",
    });

  } catch (error) {
    console.error("Error in verifyEmail:", error); // Log the error for debugging

    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Internal Server Error",
      Result: [],
    });
  }
};