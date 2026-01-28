// backend/src/controllers/employeeController.js
import { PrismaClient } from '@prisma/client';
import { generateScheduleForMonth } from '../services/scheduleGenerator.js';

 
const prisma = new PrismaClient();
 
// GET - Obtener todos los empleados
export const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching employees', message: error.message });
  }
};
 
// GET - Obtener un empleado por ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        schedules: true,
        dayReasons: true
      }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching employee', message: error.message });
  }
};
 
// POST - Crear un nuevo empleado
export const createEmployee = async (req, res) => {
  try {
    const { 
      name, 
      employeeCode, 
      position, 
      labora, 
      maxHomeDays, 
      modalidad, 
      officePlaceNumber 
    } = req.body;
 
    // Validaciones
    if (!name || !employeeCode) {
      return res.status(400).json({ 
        error: 'Name and employeeCode are required' 
      });
    }
 
    const employee = await prisma.employee.create({
      data: {
        name,
        employeeCode,
        position: position || '',
        labora: labora || 'Si',
        maxHomeDays: parseInt(maxHomeDays) || 2,
        modalidad: modalidad || 'Hibrido',
        officePlaceNumber: officePlaceNumber ? parseInt(officePlaceNumber) : null
      }
    });
 
    res.status(201).json(employee);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Employee code already exists' 
      });
    }
    res.status(500).json({ error: 'Error creating employee', message: error.message });
  }
};
 
// PUT - Actualizar un empleado
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
 
    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });
 
    res.json(employee);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: 'Error updating employee', message: error.message });
  }
};
 
// DELETE - Eliminar un empleado
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
 
    await prisma.employee.delete({
      where: { id }
    });
 
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: 'Error deleting employee', message: error.message });
  }
};
 
// POST - Generar horario automático para todos los empleados
export const generateSchedule = async (req, res) => {
  try {
    const { month, year } = req.body;
 
    if (month === undefined || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
 
    const result = await generateScheduleForMonth(parseInt(month), parseInt(year));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error generating schedule', 
      message: error.message 
    });
  }
};
 