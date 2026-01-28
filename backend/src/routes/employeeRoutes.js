// backend/src/routes/employeeRoutes.js
import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  generateSchedule
} from '../controllers/employeeController.js';

const router = express.Router();

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.post('/generate-schedule', generateSchedule);

export default router;