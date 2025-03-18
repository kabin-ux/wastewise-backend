import { Router } from "express";
import {  authorizeUserType, verifyJWT } from "../middlewares/auth.js";
import { addDrivers, deleteDriver, getAllDrivers, getCurrentDriver, loginDriver, updateDriver, updateDriverStatus, uploadProfileImage, verifyEmail, refreshAccessToken } from "../controllers/driverController.js";
import { upload } from "../config/cloudinary.js";

// Create a new router
const driverRouter = Router();

// Admin-only routes
driverRouter.get("/", verifyJWT, authorizeUserType('admin'), getAllDrivers);
driverRouter.get("/current-driver", verifyJWT, authorizeUserType('driver'), getCurrentDriver);

driverRouter.post("/:did/upload-image", verifyJWT, upload.single('profileImage'), uploadProfileImage ); 
driverRouter.put("/:did", verifyJWT, authorizeUserType('admin', 'driver'), updateDriver);
driverRouter.put("/:did/status", verifyJWT, authorizeUserType('admin', 'driver'), updateDriverStatus);
driverRouter.delete("/:did", verifyJWT, authorizeUserType('admin'), deleteDriver);

// Public routes
driverRouter.post("/", verifyJWT, authorizeUserType('admin'), addDrivers);
driverRouter.post("/login", loginDriver);
driverRouter.get("/:did/verify/:token", verifyEmail);
driverRouter.post("/refresh-token", refreshAccessToken);

export default driverRouter;
