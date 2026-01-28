// backend/src/controllers/vacationController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener vacaciones
export const getVacations = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const where = {};
    // ✅ CORREGIDO: Permite month = 0
    if (month !== undefined && month !== null) where.month = parseInt(month);
    if (year !== undefined && year !== null) where.year = parseInt(year);
    if (employeeId) where.employeeId = employeeId;

    const vacations = await prisma.vacation.findMany({
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

    res.json(vacations);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vacations', message: error.message });
  }
};

// POST - Crear vacaciones en batch (varios días)
export const createVacations = async (req, res) => {
  try {
    const { employeeId, vacationDays, month, year } = req.body;

    // ✅ CORREGIDO: Validación que permite month = 0
    if (
      !employeeId || 
      !vacationDays || 
      !Array.isArray(vacationDays) || 
      vacationDays.length === 0 ||
      month === undefined || 
      month === null || 
      !year
    ) {
      console.log('❌ [VACATION] Validación falló:', {
        employeeId,
        vacationDays,
        month,
        year
      });
      return res.status(400).json({ 
        error: 'employeeId, vacationDays (array), month, and year are required',
        received: { employeeId, vacationDays, month, year }
      });
    }

    // Validar que el empleado existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validar que cada vacation day tenga week y day
    for (const vd of vacationDays) {
      if (vd.week === undefined || vd.week === null || !vd.day) {
        return res.status(400).json({ 
          error: 'Each vacation day must have week and day',
          invalidDay: vd
        });
      }
    }

    // vacationDays debe ser un array de objetos: [{ week: 1, day: 'Lunes' }, ...]
    const vacationsToCreate = vacationDays.map(vd => ({
      employeeId,
      week: parseInt(vd.week),
      day: vd.day,
      month: parseInt(month),
      year: parseInt(year)
    }));

    // Crear vacaciones
    const created = await prisma.vacation.createMany({
      data: vacationsToCreate,
      skipDuplicates: true
    });

    console.log('✅ [VACATION] Vacaciones creadas:', created.count);

    res.status(201).json({ 
      message: 'Vacations created successfully', 
      count: created.count 
    });
  } catch (error) {
    console.error('❌ [VACATION] Error:', error);
    res.status(500).json({ error: 'Error creating vacations', message: error.message });
  }
};

// DELETE - Eliminar una vacación específica
export const deleteVacation = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.vacation.delete({
      where: { id }
    });

    res.json({ message: 'Vacation deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vacation not found' });
    }
    res.status(500).json({ error: 'Error deleting vacation', message: error.message });
  }
};

// DELETE - Eliminar todas las vacaciones de un empleado en un mes
export const deleteEmployeeVacationsInMonth = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    // ✅ CORREGIDO: Validación que permite month = 0
    if (
      !employeeId || 
      month === undefined || 
      month === null || 
      !year
    ) {
      return res.status(400).json({ 
        error: 'employeeId, month, and year are required',
        received: { employeeId, month, year }
      });
    }

    const deleted = await prisma.vacation.deleteMany({
      where: {
        employeeId,
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    res.json({ 
      message: 'Vacations deleted successfully', 
      count: deleted.count 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting vacations', message: error.message });
  }
};