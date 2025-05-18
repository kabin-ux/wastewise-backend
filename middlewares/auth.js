import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, PASSWORD_SECRET } from '../config/config.js';
import User from '../models/userModel.js';

// Middleware to verify the JWT access token
export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = {
      userId: decoded.userId,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const verifyResetToken = (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const decoded = jwt.verify(token, PASSWORD_SECRET);
    req._id = decoded._id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};



// Middleware to check if the user's role matches one of the allowed roles for the route
export const authorizeUserType = (...allowedUserTypes) => (req, res, next) => {

  // Check if user's role is in the allowed roles
  if (!allowedUserTypes.includes(req.user?.userType)) {
    console.error("Access forbidden: insufficient privileges");
    return res.status(403).json({
      Message: 'Access forbidden: insufficient privileges'
    });
  }

  next();
};

//Get Id from token
export const getIdFromToken = (token) => {
  try {
    if (!token) {
      throw new Error('Access denied, no token provided');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET); // Ensure this environment variable is set
    return decoded.userId; // Make sure your token includes the `id` field in its payload
  } catch (err) {
    throw new Error('Invalid token');
  }
};


export const getRoleFromToken = (token) => {
  try {
    if (!token) {
      throw new Error('Access denied, no token provided');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET); // Ensure this environment variable is set
    return decoded.userRole; // Make sure your token includes the `id` field in its payload
  } catch (err) {
    throw new Error('Invalid token');
  }
};


// Middleware to allow access if the user is the owner or an admin
export const authorizeUserDetailsEdit = async (req, res, next) => {
  const userType = req.user?.userType;
  const userId = req.user?.userId;

  // If admin, allow access
  if (userType === 'admin') {
    return next();
  }

  try {
    // Fetch the request by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        IsSuccess: false,
        Message: 'User not found'
      });
    }

    // Check if the request belongs to the current user
    if (user._id.toString() === userId) {
      return next(); // Allow access if the user is the owner
    }
    console.erro("ERROR!! User is not the owner")
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: User is not the owner'
    });
  } catch (error) {
    console.error("server error")
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
