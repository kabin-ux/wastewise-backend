import express from "express"; 
import dotenv from "dotenv"; 
import cors from "cors";
import connectToDB from "./database/db.js";
import userRouter from "./routes/userRoute.js";
import { PORT } from "./config/config.js";
import initializeAdmin from "./utils/autoAdminCreation.js";
import adminRouter from "./routes/adminRoute.js";
import requestRouter from "./routes/requestRoute.js";
import driverRouter from "./routes/driverRoute.js";
import inventoryRouter from "./routes/inventoryRoute.js";
import feedbackRouter from "./routes/feedbackRoute.js";
import authRouter from "./routes/authRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import { multerErrorHandler } from "./middlewares/errorHandler.js";
import recyclineGuidelineRouter from "./routes/recyclingGuidelineRoute.js";
import announcementRouter from "./routes/announcementRoute.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Define routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/drivers", driverRouter);
app.use("/api/requests", requestRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/recycling-guideline", recyclineGuidelineRouter);
app.use("/api/announcements", announcementRouter);

app.use(multerErrorHandler);

const runServer = async () => {
    try{
        // MongoDB connection
        await connectToDB();

        //Initialize admin
        await initializeAdmin();

        // Start server
        app.listen(PORT || 5005);
    }catch(error) {
        console.error("Error while starting the server", error)
    }
}

runServer();

