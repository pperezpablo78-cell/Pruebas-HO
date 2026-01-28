// backend/src/controllers/holidayController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener días festivos
export const getHolidays = async (req, res) => {
  try {
    const { month, year } = req.query;

    const where = {};
    if (month !== undefined && month !== null) where.month = parseInt(month);
    if (year !== undefined && year !== null) where.year = parseInt(year);

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { week: 'asc' }
      ]
    });

    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching holidays', message: error.message });
  }
};

// POST - Crear un día festivo
export const createHoliday = async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [BACKEND] Request body completo:', req.body);
    console.log('📥 [BACKEND] Content-Type:', req.headers['content-type']);
    
    const { week, day, description, month, year } = req.body;
    
    console.log('📥 [BACKEND] Valores extraídos:', { week, day, description, month, year });
    console.log('📥 [BACKEND] Tipos de datos:', {
      week: typeof week,
      day: typeof day,
      description: typeof description,
      month: typeof month,
      year: typeof year
    });
    console.log('📥 [BACKEND] Valores son undefined/null:', {
      week: week === undefined || week === null,
      day: !day,
      description: !description,
      month: month === undefined || month === null,
      year: !year
    });
    
    // Validación
    if (
      week === undefined || week === null || 
      !day || 
      !description || 
      month === undefined || month === null || 
      !year
    ) {
      console.log('❌ [BACKEND] Validación FALLÓ');
      console.log('❌ [BACKEND] Detalles de por qué falló:', {
        weekFallo: week === undefined || week === null ? 'week es undefined/null' : 'week OK',
        dayFallo: !day ? 'day vacío o undefined' : 'day OK',
        descriptionFallo: !description ? 'description vacío o undefined' : 'description OK',
        monthFallo: month === undefined || month === null ? 'month es undefined/null' : 'month OK',
        yearFallo: !year ? 'year vacío o undefined' : 'year OK'
      });
      
      return res.status(400).json({ 
        error: 'week, day, description, month, and year are required',
        received: { week, day, description, month, year },
        types: {
          week: typeof week,
          day: typeof day,
          description: typeof description,
          month: typeof month,
          year: typeof year
        }
      });
    }

    console.log('✅ [BACKEND] Validación PASÓ');
    console.log('💾 [BACKEND] Intentando crear holiday...');

    const holiday = await prisma.holiday.create({
      data: {
        week: parseInt(week),
        day,
        description,
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    console.log('✅ [BACKEND] Holiday creado exitosamente:', holiday);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(201).json(holiday);
  } catch (error) {
    console.error('💥 [BACKEND] Error al crear holiday:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Holiday already exists for this day' 
      });
    }
    res.status(500).json({ error: 'Error creating holiday', message: error.message });
  }
};

// PUT - Actualizar un día festivo
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const holiday = await prisma.holiday.update({
      where: { id },
      data: { description }
    });

    res.json(holiday);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(500).json({ error: 'Error updating holiday', message: error.message });
  }
};

// DELETE - Eliminar un día festivo
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.holiday.delete({
      where: { id }
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(500).json({ error: 'Error deleting holiday', message: error.message });
  }
};