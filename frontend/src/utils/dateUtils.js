// frontend/src/utils/dateUtils.js

/**
 * Generar calendario mensual
 * ⭐ MODIFICADO: Semana empieza en DOMINGO (como calendario de Windows)
 */
export const generateCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  const calendar = [];
  let week = [];
  
  // ⭐ SIN AJUSTE: La semana ya empieza en Domingo naturalmente
  // startingDayOfWeek ya es correcto (0=Domingo está en la primera columna)

  // Días de relleno al inicio (nulls)
  for (let i = 0; i < startingDayOfWeek; i++) {
    week.push(null);
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  // Días de relleno al final (nulls)
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    calendar.push(week);
  }

  return calendar;
};

/**
 * Obtener número de semana del mes
 * ⭐ MODIFICADO: Calcular semana considerando que empieza en DOMINGO
 */
export const getWeekFromDate = (year, month, day) => {
  if (!day) return 1;

  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

  // ⭐ SIN OFFSET: Como la semana empieza en Domingo, no necesitamos ajustar
  // Simplemente sumamos el día actual con el índice del primer día y dividimos por 7
  return Math.ceil((day + firstDayOfWeek) / 7);
};

/**
 * Obtener día de la semana en español
 */
export const getDayOfWeek = (year, month, day) => {
  const date = new Date(year, month, day);
  const dayIndex = date.getDay();
  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysMap[dayIndex];
};

/**
 * Obtener días laborables del mes (Lunes a Viernes)
 */
export const getWorkDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = [];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayOfWeekIndex = date.getDay();
    
    // 1 = Lunes, 5 = Viernes (días laborables)
    if (dayOfWeekIndex >= 1 && dayOfWeekIndex <= 5) {
      monthDays.push({
        day: i,
        dayName: days[dayOfWeekIndex - 1],
        week: getWeekFromDate(year, month, i)
      });
    }
  }
  return monthDays;
};