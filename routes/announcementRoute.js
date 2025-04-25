import { Router } from 'express';
import { verifyJWT, authorizeUserType } from '../middlewares/auth.js';
import { createAnnouncement, deleteAnnouncement, getAllAnnouncements, getAnnouncementById, getUserAnnouncements, updateAnnouncement } from '../controllers/announcementController.js';


const announcementRouter = Router();

// announcementRouter.get('/user-announcements', verifyJWT, authorizeUserType('user'), getUserAnnouncements);

announcementRouter.get('/', verifyJWT, authorizeUserType('admin', 'user', 'driver'), getAllAnnouncements);
announcementRouter.post('/', verifyJWT, authorizeUserType('admin'), createAnnouncement);
announcementRouter.delete('/:id', verifyJWT, authorizeUserType('admin'), deleteAnnouncement);
announcementRouter.get('/:id', verifyJWT, authorizeUserType('admin'), getAnnouncementById);


announcementRouter.put('/:id',
    verifyJWT,
    authorizeUserType('admin'),
    updateAnnouncement
);


// announcementRouter.get('/user-announcements', verifyJWT, authorizeUserType('user'), getDi);


export default announcementRouter;