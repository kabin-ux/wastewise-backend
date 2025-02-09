import { Router } from 'express';
import { verifyJWT, authorizeUserType } from '../middlewares/auth.js';
import { createFeedback, deleteFeedback, getAllFeedbacks, getUserFeedbacks, respondToFeedback, updateFeedback } from '../controllers/feedbackcontroller.js';


const feedbackRouter = Router();

// User routes
feedbackRouter.get('/', verifyJWT, authorizeUserType('admin'), getAllFeedbacks);
feedbackRouter.post('/', verifyJWT, authorizeUserType('user'), createFeedback);
feedbackRouter.delete('/:id', verifyJWT, authorizeUserType('admin', 'user'), deleteFeedback);


feedbackRouter.put('/:id',
    verifyJWT,
    authorizeUserType('admin', 'user'),
    updateFeedback
);

feedbackRouter.post('/respond-feedback/:id', verifyJWT, authorizeUserType('admin'), respondToFeedback);

feedbackRouter.get('/user-feedbacks', verifyJWT, authorizeUserType('user'), getUserFeedbacks);

export default feedbackRouter;