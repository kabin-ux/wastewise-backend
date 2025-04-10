import { Router } from 'express';
import { createGuideline, deleteGuideline, getGuidelineById, getGuidelines, updateGuideline } from '../controllers/recyclingGuidlelineController.js';
import { verifyJWT } from '../middlewares/auth.js';

const recyclineGuidelineRouter = Router();

// Public routes
recyclineGuidelineRouter.get('/', getGuidelines);
recyclineGuidelineRouter.get('/:id', getGuidelineById);

// Protected admin routes
recyclineGuidelineRouter.post('/', verifyJWT, createGuideline);
recyclineGuidelineRouter.put('/:id', verifyJWT, updateGuideline);
recyclineGuidelineRouter.delete('/:id', verifyJWT, deleteGuideline);

export default recyclineGuidelineRouter;
