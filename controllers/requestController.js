import { getIdFromToken } from "../middlewares/auth.js";
import Request from "../models/requestModel.js";
import Driver from "../models/driverModel.js";
import Notification from "../models/notificationModel.js";
import { createNotificationInternal } from "./notificationController.js";
import User from "../models/userModel.js";

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


export const createRequest = async (req, res) => {
  const { type, address, phoneNumber, scheduledDate, shift, weight, notes } = req.body;

  // Basic Required Field Check
  if (!type || !address || !scheduledDate || !weight) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      Message: "Type, address, scheduled date, and weight are required.",
    });
  }

  // Validate date (scheduledDate should be a future date)
  const scheduled = new Date(scheduledDate);
  const now = new Date();

  if (isNaN(scheduled.getTime()) || scheduled <= now) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      Message: "Scheduled date must be a valid future date.",
    });
  }

  // Validate weight
  if ( weight <= 0 || weight > 1000) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      Message: "Weight must be a number between 1 and 1000.",
    });
  }

  // Validate phone number (Nepali phone format: 98xxxxxxxx or landline)
  const phoneRegex = /^(98\d{8}|01\d{7,8})$/;
  if (phoneNumber && !phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      Message: "Invalid phone number format.",
    });
  }

  try {
    // Fetch user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        Message: "User not found.",
      });
    }

    // Prevent duplicate request on same date & address (optional)
    const duplicate = await Request.findOne({
      userId: user._id,
      scheduledDate: {
        $gte: new Date(scheduled.setHours(0, 0, 0, 0)),
        $lt: new Date(scheduled.setHours(23, 59, 59, 999))
      },
      address
    });

    if (duplicate) {
      return res.status(409).json({
        StatusCode: 409,
        IsSuccess: false,
        ErrorMessage: "You have already made a request for this date and address.",
      });
    }

    // Create the request
    const request = await Request.create({
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      type,
      address,
      phoneNumber,
      scheduledDate,
      shift,
      weight,
      notes,
      createdAt: new Date(),
      status: 'pending' // default status
    });

    res.status(201).json({
      StatusCode: 201,
      IsSuccess: true,
      request,
      Message: "Request created successfully.",
    });

  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({
      StatusCode: 500,
      IsSuccess: false,
      ErrorMessage: "Failed to create request",
      details: error.message,
    });
  }
};



// Assign driver to request
export const assignDriver = async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  try {
    // Find the request and populate user details
    const request = await Request.findById(id).populate('userId');
    if (!request) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: 'Request not found'
      });
    }

    // Find driver details
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: 'Driver not found'
      });
    }

    // Update request status
    request.driverId = driverId;
    request.status = 'assigned';
    request.assignedAt = new Date(); // Add assignment timestamp
    await request.save();

    // Create notification for the user
    try {
      // User notification
      const userNotificationData = {
        recipient: request.userId._id,
        title: 'Driver Assigned',
        message: `${driver.firstName} ${driver.lastName} has been assigned to your collection request`,
        type: 'DRIVER_ASSIGNED',
        data: {
          requestId: request._id.toString(),
          driverId: driver._id.toString(),
          driverName: `${driver.firstName} ${driver.lastName}`,
          requestType: request.type,
          status: 'assigned',
          scheduledDate: request.scheduledDate
        }
      };

      // Driver notification
      const driverNotificationData = {
        recipient: driver._id,
        title: 'New Collection Assignment',
        message: `You have been assigned to collect ${request.type} waste from ${request.name}`,
        type: 'NEW_ASSIGNMENT',
        data: {
          requestId: request._id.toString(),
          userId: request.userId._id.toString(),
          userName: request.name,
          requestType: request.type,
          address: request.address,
          scheduledDate: request.scheduledDate,
          status: 'assigned'
        }
      };

      // Send both notifications
      const [userNotification, driverNotification] = await Promise.all([
        createNotificationInternal(userNotificationData),
        createNotificationInternal(driverNotificationData)

      ]);

    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      console.error('Notification error details:', {
        error: notificationError.message,
        stack: notificationError.stack,
        userId: request.userId._id,
        driverId: driver._id,
        requestId: request._id
      });
    }

    const responseData = {
      IsSuccess: true,
      Message: "Driver assigned successfully",
      updatedRequest: {
        _id: request._id.toString(),
        userId: request.userId._id.toString(),
        driverId: driverId,
        status: 'assigned',
        type: request.type,
        address: request.address,
        scheduledDate: request.scheduledDate,
        name: request.name
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error in assignDriver:', error);
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

    const request = await Request.findById(
      id,
      { new: true }
    ).populate('userId');

    request.status = status;

    if (status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();


    if (!request) {
      return res.status(404).json({
        StatusCode: 404,
        IsSuccess: false,
        ErrorMessage: "Request not found",
      });
    }

    const notificationTypes = {
      'on_the_way': {
        type: 'DRIVER_ON_THE_WAY',
        title: 'Driver On The Way',
        message: 'Your waste collection driver is on the way.'
      },
      'cancelled': {
        type: 'REQUEST_CANCELLED',
        title: 'Request Cancelled',
        message: 'Your waste collection request has been cancelled.'
      },
      'completed': {
        type: 'REQUEST_COMPLETED',
        title: 'Collection Completed',
        message: 'Your waste collection has been completed successfully.'
      },
      'missed': {
        type: 'COLLECTION_MISSED',
        title: 'Collection Missed',
        message: 'Your scheduled collection was marked as missed.'
      }
    };

    const notificationConfig = notificationTypes[status];
    if (!notificationConfig) return;

    // Driver notification
    const userNotificationData = {
      recipientType: 'user',
      recipient: request.userId._id,
      title: notificationConfig.title,
      message: notificationConfig.message,
      type: notificationConfig.type,
      data: {
        requestId: request._id.toString(),
        scheduledDate: request.scheduledDate,
        status: status
      }
    };

    // Send both notifications
    await createNotificationInternal(userNotificationData);


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