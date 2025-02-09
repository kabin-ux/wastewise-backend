import  { Router } from 'express';
import { verifyJWT, authorizeUserType } from '../middlewares/auth.js';
import {
  getAllRequests,
  createRequest,
  assignDriver,
  updateStatus,
  deleteRequest,
  updateRequest,
  getDriverTasks,
  getUserRequests,
  cancelRequest
} from '../controllers/requestController.js';

const requestRouter = Router();

// User routes
requestRouter.get('/', verifyJWT, authorizeUserType('admin'), getAllRequests);
requestRouter.post('/', verifyJWT, authorizeUserType('user'), createRequest);

// Admin routes
requestRouter.patch('/:id/assign', verifyJWT, authorizeUserType('admin'), assignDriver);
requestRouter.delete('/:id', verifyJWT, authorizeUserType('admin'), deleteRequest);

// Admin and Driver routes
requestRouter.patch('/:id/status',
  verifyJWT,
  authorizeUserType('admin', 'driver'),
  updateStatus
);

requestRouter.put('/:id',
  verifyJWT,
  authorizeUserType('admin', 'driver'),
  updateRequest
);

requestRouter.put('/cancel-request/:id', verifyJWT, authorizeUserType('admin', 'user'), cancelRequest);

// User Requests
requestRouter.get('/user-requests', verifyJWT, authorizeUserType('user'), getUserRequests);

// Driver Tasks
requestRouter.get('/driver-tasks', verifyJWT, authorizeUserType('driver'), getDriverTasks);


//Delete request

export default requestRouter;