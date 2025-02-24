import multer from "multer";

export const multerErrorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                StatusCode: 400,
                IsSuccess: false,
                Message: "File is too large",
                ErrorMessage: ["File size should be less than 5MB"],
                Result: []
            });
        }
        return res.status(400).json({
            StatusCode: 400,
            IsSuccess: false,
            Message: "File upload error",
            ErrorMessage: [error.message],
            Result: []
        });
    }
    next(error);
};