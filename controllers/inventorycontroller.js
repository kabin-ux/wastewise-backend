import { getIdFromToken } from "../middlewares/auth.js";
import Inventory from "../models/inventoryModel.js";

// Get all requests
export const getAllItems = async (req, res) => {
    try {
        const items = await Inventory.find();


        if (!items || items.length === 0) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "No items found",
            });
        }

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Items fetched successfully",
            items
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message
        });
    }
};

// Create new request
export const addItem = async (req, res) => {
    const { name, category, quantity, price, purchaseDate, status } = req.body;

    // Validate required fields
    if (!name || !category || !quantity) {
        return res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            Message: "Name, Category, and quantity are required.",
        });
    }

    try {
        // Create the request in the database
        const item = await Inventory.create({
            name, category, quantity, price, purchaseDate, status
        });

        // Send success response
        res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            Message: "Item added successfully",
            item,
        });
    } catch (error) {
        console.error("Error adding item:", error);

        // Send error response
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Failed to add the item. Please try again later.",
        });
    }
};

// Get Item by id
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Item not found",
                Result: [],
            });
        }

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Item found successfully",
            item: item
        });

    } catch (error) {
        console.error("Error", error)

        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: "Server error",
            Result: [],
        });
    }
};


// Update request status
export const updateItemStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        // Find the item by ID
        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Item not found"
            });
        }

        // Update the item status
        item.status = status;
        await item.save();

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Item status updated successfully",
            item
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message
        });
    }
};

// Update request
export const updateItem = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        const item = await Inventory.findByIdAndUpdate(
            id,
            updatedData,
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Item not found",
            });
        }

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Item updated successfully",
            item
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message
        });
    }
};

// Delete request
export const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Inventory.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                ErrorMessage: "Item not found",
            });
        }

        res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            Message: "Item deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            ErrorMessage: error.message
        });
    }
};