import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config.js";
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      StatusCode: 401,
      IsSuccess: false,
      ErrorMessage: "Refresh token required",
      Result: null
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId, decoded.userType);
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.userType);

    return res.json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: null,
      Result: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userType: decoded.userType
      }
    });
  } catch (error) {
    console.error(error)
    return res.status(401).json({
      StatusCode: 401,
      IsSuccess: false,
      ErrorMessage: "Invalid refresh token",
      Result: null
    });
  }
};