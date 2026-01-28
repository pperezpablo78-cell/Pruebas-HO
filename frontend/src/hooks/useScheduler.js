// frontend/src/hooks/useScheduler.js
import { useState, useEffect } from 'react';
import { employeeApi, scheduleApi, dayReasonApi, holidayApi, vacationApi } from '../services/api';

export const useScheduler = () => {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [dayReasons, setDayReasons] = useState({});
  const [holidays, setHolidays] = useState({});
  const [vacations, setVacations] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar empleados
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll();
      setEmployees(response.data);
    } catch (err) {
      setError('Error al cargar empleados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar horarios
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleApi.getAll({ 
        month: currentMonth, 
        year: currentYear 
      });
      
      // Convertir array a objeto estructurado
      const scheduleObj = {};
      response.data.forEach(item => {
        if (!scheduleObj[item.employeeId]) scheduleObj[item.employeeId] = {};
        if (!scheduleObj[item.employeeId][item.week]) scheduleObj[item.employeeId][item.week] = {};
        scheduleObj[item.employeeId][item.week][item.day] = item.status;
      });
      
      setSchedule(scheduleObj);
    } catch (err) {
      setError('Error al cargar horarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar razones
  const loadDayReasons = async () => {
    try {
      const response = await dayReasonApi.getAll({ 
        month: currentMonth, 
        year: currentYear 
      });
      
      // Convertir array a objeto con keys
      const reasonsObj = {};
      response.data.forEach(item => {
        const key = `${item.employeeId}-${item.week}-${item.day}`;
        reasonsObj[key] = item.reason;
      });
      
      setDayReasons(reasonsObj);
    } catch (err) {
      console.error('Error al cargar razones:', err);
    }
  };

  // Cargar días festivos
  const loadHolidays = async () => {
    try {
      const response = await holidayApi.getAll({ 
        month: currentMonth, 
        year: currentYear 
      });
      
      // Convertir array a objeto estructurado CON ID
      const holidaysObj = {};
      response.data.forEach(item => {
        if (!holidaysObj[item.week]) holidaysObj[item.week] = {};
        holidaysObj[item.week][item.day] = {
          id: item.id,
          description: item.description
        };
      });
      
      setHolidays(holidaysObj);
    } catch (err) {
      console.error('Error al cargar días festivos:', err);
    }
  };

  // Cargar vacaciones
  const loadVacations = async () => {
    try {
      const response = await vacationApi.getAll({
        month: currentMonth,
        year: currentYear
      });

      // Convertir array a objeto estructurado
      const vacationsObj = {};
      response.data.forEach(item => {
        if (!vacationsObj[item.employeeId]) vacationsObj[item.employeeId] = {};
        if (!vacationsObj[item.employeeId][item.week]) vacationsObj[item.employeeId][item.week] = {};
        vacationsObj[item.employeeId][item.week][item.day] = {
          id: item.id
        };
      });

      setVacations(vacationsObj);
    } catch (err) {
      console.error('Error al cargar vacaciones:', err);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      loadSchedules();
      loadDayReasons();
      loadHolidays();
      loadVacations();
    }
  }, [currentMonth, currentYear, employees.length]);

  // Agregar empleado
  const addEmployee = async (employeeData) => {
    try {
      const response = await employeeApi.create(employeeData);
      setEmployees([...employees, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error al crear empleado' };
    }
  };

  // Actualizar empleado
  const updateEmployee = async (id, employeeData) => {
    try {
      const response = await employeeApi.update(id, employeeData);
      setEmployees(employees.map(emp => emp.id === id ? response.data : emp));
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error al actualizar empleado' };
    }
  };

  // Eliminar empleado
  const deleteEmployee = async (id) => {
    try {
      await employeeApi.delete(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      
      // Limpiar schedule y reasons del empleado eliminado
      const newSchedule = { ...schedule };
      delete newSchedule[id];
      setSchedule(newSchedule);
      
      const newReasons = { ...dayReasons };
      Object.keys(newReasons).forEach(key => {
        if (key.startsWith(`${id}-`)) {
          delete newReasons[key];
        }
      });
      setDayReasons(newReasons);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error al eliminar empleado' };
    }
  };

  // Actualizar celda del horario
  const updateScheduleCell = async (empId, week, day, status, reason) => {
    try {
      console.log('📤 Actualizando celda:', { empId, week, day, status, reason, currentMonth, currentYear });

      const scheduleData = {
        employeeId: String(empId),
        week: parseInt(week),
        day: String(day),
        status: String(status),
        month: parseInt(currentMonth),
        year: parseInt(currentYear)
      };

      console.log('📦 Datos preparados para enviar:', scheduleData);

      await scheduleApi.upsert(scheduleData);

      console.log('✅ Schedule actualizado exitosamente');

      if (reason) {
        const reasonData = {
          employeeId: String(empId),
          week: parseInt(week),
          day: String(day),
          reason: String(reason),
          month: parseInt(currentMonth),
          year: parseInt(currentYear)
        };

        console.log('📦 Datos de razón para enviar:', reasonData);

        await dayReasonApi.upsert(reasonData);

        const reasonKey = `${empId}-${week}-${day}`;
        setDayReasons(prev => ({
          ...prev,
          [reasonKey]: reason
        }));
      }

      setSchedule(prev => {
        const newSchedule = { ...prev };
        if (!newSchedule[empId]) newSchedule[empId] = {};
        if (!newSchedule[empId][week]) newSchedule[empId][week] = {};
        newSchedule[empId][week][day] = status;
        return newSchedule;
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Fallo al actualizar horario:", err);
      console.error("Detalles del error:", err.response?.data);
      return { 
        success: false, 
        error: err.response?.data?.error || 'Error al actualizar horario' 
      };
    }
  };

  // ⭐ MEJORADO: Agregar día festivo con logs detallados
  const addHoliday = async (holidayData) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔵 [FRONTEND] Datos recibidos en addHoliday:', holidayData);
      console.log('🔵 [FRONTEND] Tipos de cada campo:', {
        week: typeof holidayData?.week,
        day: typeof holidayData?.day,
        description: typeof holidayData?.description,
        month: typeof holidayData?.month,
        year: typeof holidayData?.year
      });
      console.log('🔵 [FRONTEND] Valores exactos:', {
        week: holidayData?.week,
        day: holidayData?.day,
        description: holidayData?.description,
        month: holidayData?.month,
        year: holidayData?.year
      });

      // Validar que holidayData existe
      if (!holidayData || typeof holidayData !== 'object') {
        throw new Error('holidayData debe ser un objeto válido');
      }

      // Formatear datos
      const formattedData = {
        week: parseInt(holidayData.week),
        day: String(holidayData.day),
        description: String(holidayData.description),
        month: parseInt(holidayData.month),
        year: parseInt(holidayData.year)
      };

      console.log('🔵 [FRONTEND] Datos después de formatear:', formattedData);
      console.log('🔵 [FRONTEND] Verificar NaN:', {
        weekIsNaN: isNaN(formattedData.week),
        monthIsNaN: isNaN(formattedData.month),
        yearIsNaN: isNaN(formattedData.year)
      });

      // Verificar que no haya NaN
      if (isNaN(formattedData.week) || isNaN(formattedData.month) || isNaN(formattedData.year)) {
        throw new Error('Datos numéricos inválidos (NaN detectado)');
      }

      console.log('🌐 [FRONTEND] Enviando al API...');
      const response = await holidayApi.create(formattedData);

      console.log('✅ [FRONTEND] Respuesta del servidor:', response.data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setHolidays(prev => {
        const updated = { ...prev };
        if (!updated[formattedData.week]) updated[formattedData.week] = {};
        updated[formattedData.week][formattedData.day] = {
          id: response.data.id,
          description: response.data.description
        };
        return updated;
      });

      // Actualizar todos los empleados para este día
      await Promise.all(
        employees.map(emp => 
          scheduleApi.upsert({
            employeeId: String(emp.id),
            week: parseInt(formattedData.week),
            day: String(formattedData.day),
            status: 'holiday',
            month: parseInt(formattedData.month),
            year: parseInt(formattedData.year)
          })
        )
      );

      await loadSchedules();
      return { success: true };
    } catch (err) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [FRONTEND] Error completo:', err);
      console.error('❌ [FRONTEND] Error name:', err.name);
      console.error('❌ [FRONTEND] Error message:', err.message);
      console.error('❌ [FRONTEND] Error response data:', err.response?.data);
      console.error('❌ [FRONTEND] Error response status:', err.response?.status);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return { 
        success: false, 
        error: err.message || err.response?.data?.error || 'Error al agregar día festivo' 
      };
    }
  };

  // Eliminar día festivo
  const deleteHoliday = async (holidayId) => {
    try {
      await holidayApi.delete(holidayId);

      // Encontrar y eliminar el holiday del estado local
      setHolidays(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(week => {
          Object.keys(updated[week]).forEach(day => {
            if (updated[week][day].id === holidayId) {
              delete updated[week][day];
              if (Object.keys(updated[week]).length === 0) {
                delete updated[week];
              }
            }
          });
        });
        return updated;
      });

      await loadSchedules();
      return { success: true };
    } catch (err) {
      console.error("❌ Fallo al eliminar día festivo:", err);
      return { success: false, error: 'Error al eliminar día festivo' };
    }
  };

  // Agregar vacaciones para un empleado
  const addVacations = async (employeeId, vacationDays) => {
    try {
      await vacationApi.create({
        employeeId,
        vacationDays,
        month: currentMonth,
        year: currentYear
      });

      await loadVacations();
      return { success: true };
    } catch (err) {
      console.error("❌ Fallo al agregar vacaciones:", err);
      return { success: false, error: 'Error al agregar vacaciones' };
    }
  };

  // Eliminar todas las vacaciones de un empleado en el mes
  const deleteEmployeeVacations = async (employeeId) => {
    try {
      await vacationApi.deleteEmployeeMonth({
        employeeId,
        month: currentMonth,
        year: currentYear
      });

      setVacations(prev => {
        const updated = { ...prev };
        delete updated[employeeId];
        return updated;
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Fallo al eliminar vacaciones:", err);
      return { success: false, error: 'Error al eliminar vacaciones' };
    }
  };

  // Generar horario automático
  const generateSchedule = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.generateSchedule(currentMonth, currentYear);
      
      await loadSchedules();
      await loadDayReasons();
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error("❌ Fallo al generar horario:", err);
      return { success: false, error: 'Error al generar horario' };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    employees,
    schedule,
    dayReasons,
    holidays,
    vacations,
    currentMonth,
    currentYear,
    currentWeek,
    loading,
    error,
    // Setters
    setCurrentMonth,
    setCurrentYear,
    setCurrentWeek,
    // Actions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateScheduleCell,
    addHoliday,
    deleteHoliday,
    addVacations,
    deleteEmployeeVacations,
    generateSchedule,
    loadSchedules,
    loadDayReasons,
    loadHolidays,
    loadVacations
  };
};