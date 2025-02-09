import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['In Stock', 'Out of Stock', 'Pending'],
        default: 'In Stock'
    },
})

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;