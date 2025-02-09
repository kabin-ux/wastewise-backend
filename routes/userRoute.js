import { Router } from "express"; 
import {
  createUser,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  loginUser,
  refreshAccessToken,
  updateUser,
  verifyEmail,
} from "../controllers/userControllers.js";
import Token from "../models/emailToken.js";
import { authorizeUserDetailsEdit, authorizeUserType, verifyJWT } from "../middlewares/auth.js";
// import { authorizeUserDetailsEdit, authorizeUserType, verifyJWT } from "../middlewares/auth.js";

// Create a new router
const userRouter = Router();

// Admin-only routes
userRouter.get("/", verifyJWT, authorizeUserType('admin'), getAllUsers); 

userRouter.get("/current-user", verifyJWT, authorizeUserType('admin', 'user'), getCurrentUser);
userRouter.put("/:uid", verifyJWT, authorizeUserType('admin', 'user'), authorizeUserDetailsEdit, updateUser); 
userRouter.delete("/:uid", verifyJWT, authorizeUserType('admin'), deleteUser); 

// Public routes
userRouter.post("/", createUser); 
userRouter.post("/login", loginUser); 
userRouter.get("/:uid/verify/:token", verifyEmail); 
userRouter.post("/refresh-token", refreshAccessToken);

export default userRouter;
