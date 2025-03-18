import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config.js'; 
import jwt from 'jsonwebtoken';

// Generate Access Token
export const generateAccessToken = (userId, userType) => {
  return jwt.sign(
    { 
      userId, userType 
    },
    ACCESS_TOKEN_SECRET, 
    { 
      expiresIn: '5s' 
    });
};

export const generateRefreshToken = (userId, userType) => {
  return jwt.sign(
    { 
      userId, userType 
    },
    REFRESH_TOKEN_SECRET, 
    { 
      expiresIn: '10d' 
    });
};
