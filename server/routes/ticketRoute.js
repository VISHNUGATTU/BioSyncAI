import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicketStatus } from '../controllers/ticketController.js';
import { authUser } from '../middlewares/authUser.js';
import { authAdmin } from '../middlewares/authAdmin.js';

const ticketRouter = express.Router();

ticketRouter.post('/', authUser, createTicket);
ticketRouter.get('/my', authUser, getMyTickets);

ticketRouter.get('/all', authAdmin, getAllTickets);
ticketRouter.put('/:id/status', authAdmin, updateTicketStatus);

export default ticketRouter;
