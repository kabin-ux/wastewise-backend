import mongoose, { Schema } from "mongoose";

const driverTokenSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 3600
    }
},
    {
        timestamps: true
    });

const DriverToken = mongoose.model("DriverToken", driverTokenSchema);
export default DriverToken;