// backend/src/routes/scheduleRoutes.js
import express from 'express';
import {
  getSchedules,
  upsertSchedule,
  createBatchSchedules,
  deleteSchedules,
  getDayReasons,
  upsertDayReason
} from '../controllers/scheduleController.js';

const router = express.Router();

// Schedules
router.get('/', getSchedules);
router.post('/', upsertSchedule);
router.post('/batch', createBatchSchedules);
router.delete('/', deleteSchedules);

// Day Reasons
router.get('/reasons', getDayReasons);
router.post('/reasons', upsertDayReason);

export default router;