import { Router } from "express";
import { assignDriver, getAdminDetails, getCurrentAdmin, loginAdmin, updateAdmin, uploadProfileImage } from "../controllers/adminController.js";
import { authorizeUserType, verifyJWT } from "../middlewares/auth.js";
import { upload } from "../config/cloudinary.js";

const adminRouter = Router();


adminRouter.post("/login", loginAdmin);
adminRouter.get("/getAdminDetails",verifyJWT, authorizeUserType('admin'), getAdminDetails);
adminRouter.get("/current-admin",verifyJWT, authorizeUserType('admin'), getCurrentAdmin);
// adminRouter.post("/refresh-token", refreshToken);

adminRouter.post("/:id/upload-image", verifyJWT, upload.single('profileImage'), uploadProfileImage ); 
adminRouter.put("/:id",verifyJWT, authorizeUserType('admin'), updateAdmin);
adminRouter.put("/assignDriver/:id",verifyJWT, authorizeUserType('admin'), assignDriver);

export default adminRouter;

