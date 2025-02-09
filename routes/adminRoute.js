import { Router } from "express";
import { assignDriver, getAdminDetails, getCurrentAdmin, loginAdmin, updateAdmin } from "../controllers/adminController.js";
import { authorizeUserType, verifyJWT } from "../middlewares/auth.js";

const adminRouter = Router();


adminRouter.post("/loginAdmin", loginAdmin);
adminRouter.get("/getAdminDetails",verifyJWT, authorizeUserType('admin'), getAdminDetails);
adminRouter.get("/current-admin",verifyJWT, authorizeUserType('admin'), getCurrentAdmin);
adminRouter.put("/:id",verifyJWT, authorizeUserType('admin'), updateAdmin);
adminRouter.put("/assignDriver/:id",verifyJWT, authorizeUserType('admin'), assignDriver);

export default adminRouter;

