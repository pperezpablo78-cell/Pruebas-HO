// backend/src/controllers/scheduleController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener horarios por mes y año
export const getSchedules = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const where = {};
    // ✅ CORREGIDO: Permite month = 0
    if (month !== undefined && month !== null) where.month = parseInt(month);
    if (year !== undefined && year !== null) where.year = parseInt(year);
    if (employeeId) where.employeeId = employeeId;

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { week: 'asc' }
      ]
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching schedules', message: error.message });
  }
};

// POST - Crear o actualizar un horario
export const upsertSchedule = async (req, res) => {
  try {
    const { employeeId, week, day, status, month, year } = req.body;

    // ✅ CORREGIDO: Validación que permite month = 0 y week = 0
    if (
      !employeeId || 
      week === undefined || week === null || 
      !day || 
      month === undefined || month === null || 
      !year
    ) {
      console.log('❌ [SCHEDULE] Validación falló:', {
        employeeId,
        week,
        day,
        status,
        month,
        year
      });
      return res.status(400).json({ 
        error: 'employeeId, week, day, month, and year are required',
        received: { employeeId, week, day, status, month, year }
      });
    }

    const schedule = await prisma.schedule.upsert({
      where: {
        employeeId_week_day_month_year: {
          employeeId,
          week: parseInt(week),
          day,
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      update: {
        status: status || 'office'
      },
      create: {
        employeeId,
        week: parseInt(week),
        day,
        status: status || 'office',
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    res.json(schedule);
  } catch (error) {
    console.error('❌ [SCHEDULE] Error en upsert:', error);
    res.status(500).json({ error: 'Error upserting schedule', message: error.message });
  }
};

// POST - Crear múltiples horarios en batch
export const createBatchSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: 'schedules must be an array' });
    }

    const created = await prisma.schedule.createMany({
      data: schedules,
      skipDuplicates: true
    });

    res.json({ 
      message: 'Schedules created successfully', 
      count: created.count 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating schedules', message: error.message });
  }
};

// DELETE - Eliminar horarios por mes y año
export const deleteSchedules = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const where = {};
    // ✅ CORREGIDO: Permite month = 0
    if (month !== undefined && month !== null) where.month = parseInt(month);
    if (year !== undefined && year !== null) where.year = parseInt(year);
    if (employeeId) where.employeeId = employeeId;

    const deleted = await prisma.schedule.deleteMany({
      where
    });

    res.json({ 
      message: 'Schedules deleted successfully', 
      count: deleted.count 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting schedules', message: error.message });
  }
};

// GET - Obtener razones de días
export const getDayReasons = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const where = {};
    // ✅ CORREGIDO: Permite month = 0
    if (month !== undefined && month !== null) where.month = parseInt(month);
    if (year !== undefined && year !== null) where.year = parseInt(year);
    if (employeeId) where.employeeId = employeeId;

    const dayReasons = await prisma.dayReason.findMany({
      where,
      include: {
        employee: true
      }
    });

    res.json(dayReasons);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching day reasons', message: error.message });
  }
};

// POST - Crear o actualizar una razón de día
export const upsertDayReason = async (req, res) => {
  try {
    const { employeeId, week, day, reason, month, year } = req.body;

    // ✅ CORREGIDO: Validación que permite month = 0 y week = 0
    if (
      !employeeId || 
      week === undefined || week === null || 
      !day || 
      month === undefined || month === null || 
      !year
    ) {
      return res.status(400).json({ 
        error: 'employeeId, week, day, month, and year are required',
        received: { employeeId, week, day, reason, month, year }
      });
    }

    const dayReason = await prisma.dayReason.upsert({
      where: {
        employeeId_week_day_month_year: {
          employeeId,
          week: parseInt(week),
          day,
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      update: {
        reason: reason || ''
      },
      create: {
        employeeId,
        week: parseInt(week),
        day,
        reason: reason || '',
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    res.json(dayReason);
  } catch (error) {
    res.status(500).json({ error: 'Error upserting day reason', message: error.message });
  }
};