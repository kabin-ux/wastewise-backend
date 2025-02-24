import { Router } from "express";
import { refreshAccessToken } from "../controllers/refreshToken.js";

const authRouter = Router();

authRouter.post('/refresh-token', refreshAccessToken)

export default authRouter;