// frontend/src/utils/scheduleUtils.js
import { CAUSAS } from './constants';

export const isHomeOfficeReason = (reasonName) => {
  return reasonName && (
    reasonName.includes('Home Office') || 
    reasonName.includes('Enfermedad') ||
    reasonName.includes('Maternidad') ||
    reasonName.includes('Paternidad') ||
    reasonName.includes('Lactancia') ||
    reasonName.includes('Salud')
  );
};

export const getReasonColor = (reasonName) => {
  if (!reasonName) return null;
  const causa = CAUSAS.find(c => c.name === reasonName);
  return causa ? causa.color : '#FFFFFF';
};

export const getHomeOfficeColor = () => {
  const ho = CAUSAS.find(c => c.name === 'Home Office');
  return ho ? ho.color : '#90EE90';
};

export const countHomeDays = (schedule, empId, week) => {
  if (!schedule[empId] || !schedule[empId][week]) return 0;
  return Object.values(schedule[empId][week]).filter(status => status === 'home').length;
};

export const countHomeDaysInMonth = (schedule, empId, monthDays) => {
  let count = 0;
  monthDays.forEach(d => {
    const status = schedule[empId]?.[d.week]?.[d.dayName];
    if (status === 'home') {
      count++;
    }
  });
  return count;
};