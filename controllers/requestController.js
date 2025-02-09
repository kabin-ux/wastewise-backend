import { getIdFromToken } from "../middlewares/auth.js";
import Request from "../models/requestModel.js";

// Get all requests
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find();
    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      requests,
      Message: "Requests fetched successfully"
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
export const createRequest = async (req, res) => {
  const { name, type, address, phoneNumber, scheduledDate, shift, notes } = req.body;

  // Validate required fields
  if (!type || !address || !scheduledDate) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      Message: "Type, address, and scheduled date are required.",
    });
  }

  try {
    // Create the request in the database
    const request = await Request.create({
      userId: req.user.userId, // User ID from authentication middleware
      name, type, address, phoneNumber, scheduledDate, shift, notes
    });

    // Send success response
    res.status(201).json({
      StatusCode: 201,
      IsSuccess: true,
      request,
      Message: "Request added successfully"
    });
  } catch (error) {
    console.error("Error creating request:", error);

    // Send error response
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Failed to create the request. Please try again later.",
    });
  }
};


// Assign driver to request
export const assignDriver = async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  try {
    const request = await Request.findByIdAndUpdate(
      id,
      {
        driverId,
        status: 'assigned'
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: 'Request not found'
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Request updated successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message
    });
  }
};

// Update request status
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const request = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Request not found",
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Request status updated successfully",
      request
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
export const updateRequest = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const request = await Request.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Request not found"
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Request updated successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message
    });
  }
};

// Get User Requests
export const getUserRequests = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      StatusCode: 401,
      IsSuccess: false,
      ErrorMessage: "Unauthorized: No token provided",
    });
  }

  try {
    const userId = getIdFromToken(token); // Extract the user ID

    if (!userId) {
      return res.status(403).json({
        StatusCode: 403,
        IsSuccess: false,
        ErrorMessage: "Forbidden: Invalid token",
      });
    }

    const requests = await Request.find({
      userId,
    });


    if (!requests || requests.length === 0) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "No requests found for this user",
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Requests of the entered user fetched successfully",
      requests
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message
    });
  }
};

// Get Driver Tasks
export const getDriverTasks = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      StatusCode: 401,
      IsSuccess: false,
      ErrorMessage: "Unauthorized: No token provided",
    });
  }

  try {
    const driverId = getIdFromToken(token); // Extract the driver ID

    if (!driverId) {
      return res.status(403).json({
        StatusCode: 403,
        IsSuccess: false,
        ErrorMessage: "Forbidden: Invalid token",
      });
    }

    const tasks = await Request.find({
      driverId,
    });


    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "No tasks found for this driver",
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Tasks of the driver fetched successfully",
      tasks
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message
    });
  }
};


//Cancel request
export const cancelRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the request first
    const existingRequest = await Request.findById(id);

    // Check if request exists
    if (!existingRequest) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Request not found",
      });
    }

    // Check if the request is already cancelled
    if (existingRequest.status === "cancelled") {
      return res.status(400).json({
        StatusCode: 400,
        IsSuccess: false,
        ErrorMessage: "Request is already cancelled",
      });
    }

    // Update status to 'cancelled'
    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Message: "Request cancelled successfully",
      request: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message,
    });
  }
};



// Delete request
export const deleteRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const existingRequest = await Request.findById(id);

    // Check if request exists
    if (!existingRequest) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Request not found",
      });
    }

    await Request.findByIdAndDelete(id);

    res.status(200).json({
      IsSuccess: true,
      Message: "Request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: error.message
    });
  }
};