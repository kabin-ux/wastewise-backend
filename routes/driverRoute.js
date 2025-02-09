import { Router } from "express";
import {
  refreshAccessToken,
} from "../controllers/userControllers.js";
import {  authorizeUserType, verifyJWT } from "../middlewares/auth.js";
import { addDrivers, deleteDriver, getAllDrivers, getCurrentDriver, loginDriver, updateDriver, updateDriverStatus, verifyEmail } from "../controllers/driverController.js";

// Create a new router
const driverRouter = Router();

// Admin-only routes
driverRouter.get("/", verifyJWT, authorizeUserType('admin'), getAllDrivers);
driverRouter.get("/current-driver", verifyJWT, authorizeUserType('driver'), getCurrentDriver);

// get feedback by id
driverRouter.put("/:did", verifyJWT, authorizeUserType('admin', 'driver'), updateDriver);
driverRouter.put("/:did/status", verifyJWT, authorizeUserType('admin', 'driver'), updateDriverStatus);
driverRouter.delete("/:did", verifyJWT, authorizeUserType('admin'), deleteDriver);

// Public routes
driverRouter.post("/", verifyJWT, authorizeUserType('admin'), addDrivers);
driverRouter.post("/login", loginDriver);
driverRouter.get("/:did/verify/:token", verifyEmail);
driverRouter.post("/refresh-token", refreshAccessToken);

export default driverRouter;
