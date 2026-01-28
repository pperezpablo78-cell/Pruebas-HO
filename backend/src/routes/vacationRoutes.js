// backend/src/routes/vacationRoutes.js
import express from 'express';
import {
  getVacations,
  createVacations,
  deleteVacation,
  deleteEmployeeVacationsInMonth
} from '../controllers/vacationController.js';

const router = express.Router();

router.get('/', getVacations);
router.post('/', createVacations);
router.delete('/:id', deleteVacation);
router.delete('/employee/month', deleteEmployeeVacationsInMonth);

export default router;