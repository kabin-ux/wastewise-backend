import { Router } from "express";
import { authorizeUserType, verifyJWT } from "../middlewares/auth.js";
import { addItem, deleteItem, getAllItems, getItemById, updateItem, updateItemStatus } from "../controllers/inventorycontroller.js";

const inventoryRouter = Router();

inventoryRouter.get('/', verifyJWT, authorizeUserType('admin'), getAllItems );

inventoryRouter.post('/', verifyJWT, authorizeUserType('admin'), addItem);

inventoryRouter.get('/:id', verifyJWT, authorizeUserType('admin'), getItemById );

inventoryRouter.put('/update-item/:id', verifyJWT, authorizeUserType('admin'), updateItem );

inventoryRouter.put('/update-status', verifyJWT, authorizeUserType('admin'), updateItemStatus);

inventoryRouter.delete('/delete-item/:id', verifyJWT, authorizeUserType('admin'), deleteItem);

export default inventoryRouter;