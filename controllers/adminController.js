// ErrorHandler.js
import { REFRESH_TOKEN_SECRET } from "../config.js";
import { cloudinary } from "../config/cloudinary.js";
import Admin from "../models/adminModel.js";
import  jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import streamifier from 'streamifier';

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({
        errorMessage: "User does not exist"
      });
    }
    // Check password validity
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        errorMessage: "Invalid user credentials",
      });
    }

    // Retrieve user info excluding password and refresh token
    const loggedInUser = await Admin.findById(user._id).select("-password -refreshToken");
    await loggedInUser.save();

    // Generate token with user ID and type
    const userType = "admin"; // Define based on user model, or derive based on the table
    const accessToken = generateAccessToken(user._id, userType);
    const refreshToken = generateRefreshToken(user._id, userType);


    res.status(200).json({
      loggedInUser,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Login successful",
        loggedInUser
      },
      accessToken, refreshToken
    });
  } catch (err) {
    console.error("Error occured", err);

    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Unable to login, Server Error",
      Result: []
    });
  }
};

export const getAdminDetails = async (req, res) => {
  try {
    const admins = await Admin.find();
    if (!admins) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Admin not found",
        Result: []
      });
    }
    return res.status(200).json({
      admins,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Admin found",
        admins
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Error retrieving admin",
      Result: []
    });
  }
};

export const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId);

    if (!admin) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "User not found",
        Result: [],
      });
    }

    return res.status(200).json({
      admin,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        admin: admin,
        Message: "Current admin fetched successfully"
      },
    });
  } catch (error) {
    console.error("Error occurred", error);

    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Server error",
      Result: [],
    });
  }
};


// Update user details
export const updateAdmin = async (req, res, next) => {
  const { id } = req.params;
  const { firstName, lastName, email, password } = req.body;

  try {
    // Prepare the data to update
    const updateAdminData = { firstName, lastName, email };

    // Handle profile image upload
    if (req.file) {
      // If user already has a profile image, delete it from Cloudinary
      const admin = await Admin.findById(id);
      if (admin?.profileImage?.public_id) {
        await cloudinary.uploader.destroy(admin.profileImage.public_id);
      }

      // Add new profile image data
      updateAdminData.profileImage = {
        public_id: req.file.filename,
        url: req.file.path
      };
    }


    // If the password is provided, hash it and add it to the update data
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateAdminData.password = await bcrypt.hash(password, salt);
    }

    // Find and update the user
    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateAdminData, { new: true });


    // If no user found, return an error
    if (!updatedAdmin) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        Message: "User not found or unable to update",
        ErrorMessage: [],
        Result: [],
      });
    }

    // Remove password from response
    const userResponse = updatedAdmin.toObject();
    delete userResponse.password;

    // Return a success response with updated user details
    return res.status(200).json({
      updatedAdmin,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Admin details updated successfully",
        UpdatedUser: userResponse,
      },
    });
  } catch (err) {
    console.error("Error occurred", err); // Log the error for debugging
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Error occurred while updating admin",
      Result: [],
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
            folder: 'admin-profile-images',
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
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        profileImage: {
          public_id: result.public_id,
          url: result.secure_url
        }
      },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        Message: "Admin not found",
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


export const refreshAccessToken = async (req, res) => {
  try {
    const incomingToken = req.headers.authorization?.split(" ")[1];
    const incomingRefreshToken = incomingToken;

    if (!incomingRefreshToken) {
      return res.status(400).json({
        ErrorMessage: "Unauthorized request"
      })
    }
    //verify tokens
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

    const currentTime = Math.floor(Date.now() / 1000);


    //check if refresh token expired or not
    if (decodedToken.exp < currentTime) {
      return res.status(400).json({
        ErrorMessage: "Refresh token has expired"
      })
    }


    const admin = await Admin.findById(decodedToken?.userId);

    const userType = decodedToken?.userType;

    if (!admin) {
      res.status(400).json({
        errorMessage: "Invalid refresh token"
      })
    }

    const newAccessToken = await generateAccessToken(admin._id, userType);

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