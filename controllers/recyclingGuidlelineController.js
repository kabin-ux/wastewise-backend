import { RecyclingGuideline } from "../models/recyclingGuidelineModel.js";

export const createGuideline = async (req, res) => {
    try {
        const { category, title, items, tips } = req.body;

        if (!category || !title || !items) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const guideline = await RecyclingGuideline.create({
            category,
            title,
            items,
            tips
        })

        return res.status(201).json({
            StatusCode: 201,
            IsSuccess: true,
            guideline,
            Message: "Recycling Guideline created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal Server Error",
            ErrorMessage: error.message
        })
    }
}

// Get all guidelines
export const getGuidelines = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};

        const guidelines = await RecyclingGuideline.find(filter);
        return res
            .status(200)
            .json({
                StatusCode: 200,
                IsSuccess: true,
                guidelines,
                Message: "Recycling Guidelines fetched successfully",
            });
    } catch (error) {
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal Server Error",
            ErrorMessage: error.message
        })
    }
};

// Get guideline by ID
export const getGuidelineById = async (req, res) => {
    try {
        const { id } = req.params;

        const guideline = await RecyclingGuideline.findById(id);

        if (!guideline) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Guideline not found"
            })
        }

        return res
            .status(200)
            .json({
                StatusCode: 200,
                IsSuccess: true,
                guideline,
                Message: "Recycling Guideline fetched successfully",
            });
    } catch (error) {
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal Server Error",
            error: error.message
        })

    }
};

// Update guideline
export const updateGuideline = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const guideline = await RecyclingGuideline.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!guideline) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Guideline not found",
            })
        }

        return res
            .status(200)
            .json(
                {
                    StatusCode: 200,
                    IsSuccess: true,
                    guideline,
                    Message: "Recycling Guideline updated successfully",
                }
            );
    } catch (error) {
        return res.status(4500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal Server Error",
            ErrorMessage: error.message
        })
    }
};

// Delete guideline
export const deleteGuideline = async (req, res) => {
    try {
        const { id } = req.params;

        const guideline = await RecyclingGuideline.findByIdAndDelete(id);

        if (!guideline) {
            return res.status(404).json({
                StatusCode: 404,
                IsSuccess: false,
                Message: "Guideline not found",
            })
        }

        return res
            .status(200)
            .json({
                StatusCode: 200,
                IsSuccess: true,
                Message: "Guideline deleted successfully"
            });
    } catch (error) {
        return res.status(500).json({
            StatusCode: 500,
            IsSuccess: false,
            Message: "Internal Server Error",
            ErrorMessage: error.message
        })
    }
};