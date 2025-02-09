import mongoose from "mongoose";
import { MONGODB_URL } from "../config.js";

const connectToDB = async () => {
    await mongoose.connect(MONGODB_URL).then((res) => {
        console.log("Connected to Database successfully");
    })
}

export default connectToDB;