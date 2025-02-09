// ErrorHandler.js
import Admin from "../models/adminModel.js";
import Request from "../models/requestModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";

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
export const updateAdmin = async (req, res, next) => {
  const { id } = req.params;
  const { firstName, lastName, email, password} = req.body;

  try {
    // Prepare the data to update
    const updateData = { firstName, lastName, email };

    // If the password is provided, hash it and add it to the update data
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Find and update the user
    const user = await Admin.findByIdAndUpdate(id, updateData, { new: true });

    // If no user found, return an error
    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        Message: "User not found or unable to update",
        ErrorMessage: [],
        Result: [],
      });
    }

    // Return a success response with updated user details
    return res.status(200).json({
      user,
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        Message: "Admin details updated successfully",
        UpdatedUser: user,
      },
    });
  } catch (err) {
    console.error("Error occurred", err); // Log the error for debugging
    return res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Error occurred while updating user",
      Result: [],
    });
  }
};


export const assignDriver = async (req, res) => {
  const { id } = req.params; // Request ID
  const { driverId } = req.body; // Driver ID from request body


  try {
    // Update the request by ID, set status and assign driverId
    const updatedRequest = await Request.findByIdAndUpdate(
      id, // Request ID
      { status: 'Assigned', driverId }, // Fields to update
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }


    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      updatedRequest,
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message,
    });
  }
};
