import { Router } from "express";
import { getAdminDetails, getCurrentAdmin, loginAdmin, refreshAccessToken, updateAdmin, uploadProfileImage } from "../controllers/adminController.js";
import { authorizeUserType, verifyJWT } from "../middlewares/auth.js";
import { upload } from "../config/cloudinary.js";

const adminRouter = Router();


adminRouter.post("/login", loginAdmin);
adminRouter.get("/getAdminDetails",verifyJWT, authorizeUserType('admin'), getAdminDetails);
adminRouter.get("/current-admin",verifyJWT, authorizeUserType('admin'), getCurrentAdmin);

adminRouter.post("/:id/upload-image", verifyJWT, upload.single('profileImage'), uploadProfileImage ); 
adminRouter.put("/:id",verifyJWT, authorizeUserType('admin'), updateAdmin);
adminRouter.post("/refresh-token", refreshAccessToken);

export default adminRouter;

