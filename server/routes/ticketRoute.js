import express from 'express';
import { 
  createTicket, 
  getMyTickets, 
  getAllTickets, 
  updateTicketStatus,
  replyToTicket 
} from '../controllers/ticketController.js';
import { authUser } from '../middlewares/authUser.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { authGeneral } from '../middlewares/authGeneral.js';

const ticketRouter = express.Router();

ticketRouter.post('/', authUser, createTicket);
ticketRouter.get('/my', authUser, getMyTickets);
ticketRouter.post('/:id/reply', authGeneral, replyToTicket);

ticketRouter.get('/all', authAdmin, getAllTickets);
ticketRouter.put('/:id/status', authAdmin, updateTicketStatus);

export default ticketRouter;
