import mongoose from "mongoose";
import { MONGODB_URL } from "../config.js";

const connectToDB = async () => {
    await mongoose.connect(MONGODB_URL).then((res) => {
    })
}

export default connectToDB;