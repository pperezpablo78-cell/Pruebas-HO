// frontend/src/utils/constants.js

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAYS_OF_WEEK = [
  'Domingo',   // 0
  'Lunes',     // 1
  'Martes',    // 2
  'Miércoles', // 3
  'Jueves',    // 4
  'Viernes',   // 5
  'Sábado'     // 6
];

export const CAUSAS = [
  { name: 'Home Office', color: '#90EE90' },
  { name: 'Servicio', color: '#FFFF00' },
  { name: 'Maternidad/Paternidad', color: '#FFC0CB' },
  { name: 'Lactancia', color: '#FF00FF' },
  { name: 'Salud', color: '#87CEEB' },
  { name: 'Suspensión Igss', color: '#FFA500' },
  { name: 'Vacaciones', color: '#FFD700' },
  { name: 'En sitio', color: '#FFFFFF' }, 
  { name: 'Suspendido EPSS', color: '#FF6347' },
  { name: 'Canje horas', color: '#DDA0DD' },
  { name: 'NL - No labora', color: '#D3D3D3' },
  { name: 'Home Office - Enfermedad', color: '#98FB98' },
  { name: 'Asueto / Feriado', color: '#FFFF00' }
];

export const MODALIDADES = {
  HIBRIDO: 'Hibrido',
  FULL_REMOTO: 'Full Remoto',
  TURNO_ROTATIVO: 'Turno Rotativo',
  EN_SITIO: 'En Sitio' // ⭐ NUEVA MODALIDAD
};

// ⭐ LISTA DE MODALIDADES PARA SELECT/DROPDOWN
export const MODALIDADES_LIST = [
  { value: 'Hibrido', label: 'Híbrido (2-3 días HO por semana)', maxHomeDays: 3 },
  { value: 'Full Remoto', label: 'Full Remoto (5 días HO)', maxHomeDays: 5 },
  { value: 'Turno Rotativo', label: 'Turno Rotativo (alternado por semana)', maxHomeDays: 0 },
  { value: 'En Sitio', label: 'En Sitio (100% Presencial)', maxHomeDays: 0 } // ⭐ NUEVA
];

export const STATUS = {
  HOME: 'home',
  OFFICE: 'office',
  HOLIDAY: 'holiday'
};