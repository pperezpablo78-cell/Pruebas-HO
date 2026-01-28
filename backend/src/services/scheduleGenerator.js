// backend/src/services/scheduleGenerator.js - VERSIÓN 4.0 ALTERNANCIA SIMPLE
import { PrismaClient } from '@prisma/client';
 
const prisma = new PrismaClient();
 
// ==================== CONFIGURACIÓN ====================
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const WEEKS_IN_MONTH = 5;
const OFFICE_CAPACITY = 12;
const MIN_OFFICE_DAYS = 2;
const MAX_OFFICE_DAYS = 3;

// ==================== PATRONES SIN CONSECUTIVOS ====================

const SAFE_PATTERNS = {
  2: [
    // GAPS GRANDES (PREFERIDOS)
    { days: [0, 3], name: 'Lun-Jue', gaps: [3], score: 100 },
    { days: [1, 4], name: 'Mar-Vie', gaps: [3], score: 100 },
    
    // GAPS MEDIANOS
    { days: [0, 2], name: 'Lun-Mie', gaps: [2], score: 90 },
    { days: [2, 4], name: 'Mie-Vie', gaps: [2], score: 90 },
    { days: [1, 3], name: 'Mar-Jue', gaps: [2], score: 85 },
  ],
  3: [
    // PATRÓN PERFECTO
    { days: [0, 2, 4], name: 'Lun-Mie-Vie', gaps: [2, 2], score: 100 },
    
    // ALTERNATIVOS (si necesario)
    { days: [0, 2, 3], name: 'Lun-Mie-Jue', gaps: [2, 1], score: 75 },
    { days: [1, 2, 4], name: 'Mar-Mie-Vie', gaps: [1, 2], score: 75 },
    { days: [0, 1, 3], name: 'Lun-Mar-Jue', gaps: [1, 2], score: 70 },
    { days: [1, 3, 4], name: 'Mar-Jue-Vie', gaps: [2, 1], score: 70 },
  ]
};

// ==================== UTILIDADES ====================

const seededRandom = (seed, iteration = 0) => {
  const x = Math.sin(seed * 12.9898 + iteration * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const generateSeed = (employeeId, week, month, year, extra = 0) => {
  const idSum = employeeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return idSum * 10000 + year * 1000 + month * 100 + week * 10 + extra;
};

const shuffleArray = (array, seed) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed, i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ==================== VALIDACIONES ====================

/**
 * ✅ Detecta si tiene Viernes Y Lunes juntos
 */
const hasViernesLunesViolation = (days) => {
  if (!days || !Array.isArray(days) || days.length === 0) return false;
  return days.includes('Lunes') && days.includes('Viernes');
};

/**
 * ✅ Detecta días consecutivos
 */
const hasConsecutiveDays = (days) => {
  if (!days || !Array.isArray(days) || days.length < 2) return false;
  
  const indices = days.map(d => WEEK_DAYS.indexOf(d)).sort((a, b) => a - b);
  
  for (let i = 0; i < indices.length - 1; i++) {
    if (indices[i + 1] - indices[i] === 1) return true; // ❌ CONSECUTIVOS
  }
  
  return false;
};

/**
 * ✅ Validación completa
 */
const isValidDaySet = (days) => {
  if (!days || !Array.isArray(days)) return false;
  if (days.length === 0) return true;
  if (days.length > MAX_OFFICE_DAYS) return false;
  
  // CRÍTICO 1: NO Viernes+Lunes
  if (hasViernesLunesViolation(days)) return false;
  
  // CRÍTICO 2: NO consecutivos
  if (hasConsecutiveDays(days)) return false;
  
  return true;
};

/**
 * ✅ Calcula gaps
 */
const calculateGaps = (days) => {
  if (days.length < 2) return [];
  
  const indices = days.map(d => WEEK_DAYS.indexOf(d)).sort((a, b) => a - b);
  const gaps = [];
  
  for (let i = 0; i < indices.length - 1; i++) {
    gaps.push(indices[i + 1] - indices[i]);
  }
  
  return gaps;
};

/**
 * ✅ Score de calidad
 */
const scorePattern = (days) => {
  if (!days || days.length === 0) return 0;
  
  let score = 100;
  
  if (hasViernesLunesViolation(days)) score -= 1000;
  if (hasConsecutiveDays(days)) score -= 500;
  
  const gaps = calculateGaps(days);
  for (const gap of gaps) {
    if (gap >= 3) score += 50;
    else if (gap === 2) score += 30;
    else if (gap === 1) score -= 100;
  }
  
  return score;
};

/**
 * ✅ Selecciona el mejor patrón disponible
 */
const selectBestPattern = (availableDays, targetDays, context, seed) => {
  const { avoidMonday, dayCapacity } = context;
  
  let validDays = [...availableDays];
  if (avoidMonday && validDays.includes('Lunes')) {
    validDays = validDays.filter(d => d !== 'Lunes');
  }
  
  if (validDays.length < targetDays) {
    targetDays = Math.min(validDays.length, MAX_OFFICE_DAYS);
  }
  
  if (validDays.length === 0 || targetDays === 0) return [];
  
  const patterns = SAFE_PATTERNS[targetDays] || [];
  
  if (patterns.length === 0) {
    return selectManualBestGaps(validDays, targetDays, seed);
  }
  
  const validPatterns = patterns.filter(pattern => {
    const days = pattern.days.map(idx => WEEK_DAYS[idx]);
    
    for (const day of days) {
      if (!validDays.includes(day)) return false;
    }
    
    if (avoidMonday && days.includes('Lunes')) return false;
    
    return true;
  });
  
  if (validPatterns.length === 0) {
    return selectManualBestGaps(validDays, targetDays, seed);
  }
  
  const scoredPatterns = validPatterns.map(pattern => {
    let dynamicScore = pattern.score;
    
    if (dayCapacity) {
      for (const idx of pattern.days) {
        const day = WEEK_DAYS[idx];
        const capacity = dayCapacity[day] || 0;
        const ratio = capacity / OFFICE_CAPACITY;
        dynamicScore -= ratio * 10;
      }
    }
    
    return { ...pattern, dynamicScore };
  });
  
  scoredPatterns.sort((a, b) => b.dynamicScore - a.dynamicScore);
  
  const selected = scoredPatterns[0];
  return selected.days.map(idx => WEEK_DAYS[idx]);
};

/**
 * ✅ Selección manual maximizando gaps
 */
const selectManualBestGaps = (availableDays, targetDays, seed) => {
  if (availableDays.length === 0 || targetDays === 0) return [];
  
  const selected = [];
  const remaining = [...availableDays];
  
  let attempts = 0;
  const maxAttempts = targetDays * 20;
  
  while (selected.length < targetDays && remaining.length > 0 && attempts < maxAttempts) {
    attempts++;
    
    let bestDay = null;
    let bestScore = -Infinity;
    
    for (const candidate of remaining) {
      const testSet = [...selected, candidate];
      
      if (!isValidDaySet(testSet)) continue;
      
      const score = scorePattern(testSet);
      
      if (score > bestScore) {
        bestScore = score;
        bestDay = candidate;
      }
    }
    
    if (bestDay === null) {
      console.warn(`⚠️ No se encontró día válido sin consecutivos (intentos: ${attempts})`);
      break;
    }
    
    selected.push(bestDay);
    remaining.splice(remaining.indexOf(bestDay), 1);
  }
  
  return selected.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
};

/**
 * ✅ ALTERNANCIA SIMPLE: 2 → 3 → 2 → 3 → 2 (o viceversa)
 * 
 * REGLA PRINCIPAL: Si la semana anterior tuvo X días, esta semana tendrá (5-X) días
 * - Si anterior fue 2 días oficina → esta semana 3 días oficina
 * - Si anterior fue 3 días oficina → esta semana 2 días oficina
 */
const getSimpleAlternation = (employeeId, week, officeDaysHistory, seed) => {
  // Primera semana: Aleatorio entre 2 y 3
  if (officeDaysHistory.length === 0) {
    return seededRandom(seed) > 0.5 ? 3 : 2;
  }
  
  // ✅ ALTERNANCIA SIMPLE: Si anterior fue 3 → ahora 2, si fue 2 → ahora 3
  const lastWeekDays = officeDaysHistory[officeDaysHistory.length - 1];
  
  return lastWeekDays === 3 ? 2 : 3;
};

// ==================== BALANCEO ====================

const intelligentBalancing = (
  hybridEmployees,
  enSitioEmployees,
  week,
  holidayMap,
  vacationMap,
  lastFridayMap,
  employeeOfficeHistory
) => {
  const officeAssignments = {};
  const dayCapacity = {};
  
  // Inicializar capacidad base
  WEEK_DAYS.forEach(day => {
    dayCapacity[day] = enSitioEmployees.filter(emp => 
      !vacationMap[emp.id]?.[week]?.[day] && !holidayMap[week]?.[day]
    ).length;
  });
  
  // Preparar empleados
  const enrichedEmployees = hybridEmployees.map(emp => {
    const availableDays = WEEK_DAYS.filter(day => 
      !vacationMap[emp.id]?.[week]?.[day] && !holidayMap[week]?.[day]
    );
    
    const prevWeekDays = employeeOfficeHistory[emp.id]?.[week - 2] || [];
    const avoidMonday = week === 1 
      ? lastFridayMap[emp.id] || false
      : prevWeekDays.includes('Viernes');
    
    const seed = generateSeed(emp.id, week, 0, 2025);
    
    // Historial: [3, 2, 3, 2, ...] (número de días de oficina por semana)
    const officeDaysHistory = (employeeOfficeHistory[emp.id] || []).map(days => 
      Array.isArray(days) ? days.length : 0
    );
    
    // ✅ ALTERNANCIA SIMPLE
    let targetDays = getSimpleAlternation(emp.id, week, officeDaysHistory, seed);
    
    // Ajustar si no hay suficientes días disponibles
    targetDays = Math.min(targetDays, availableDays.length, MAX_OFFICE_DAYS);
    targetDays = Math.max(targetDays, MIN_OFFICE_DAYS);
    
    return {
      employee: emp,
      availableDays,
      targetDays,
      avoidMonday,
      seed,
      officeDaysHistory
    };
  });
  
  // Shuffle para variedad
  const shuffled = shuffleArray(enrichedEmployees, week * 31337);
  
  console.log(`\n   📊 Muestra de empleados (Semana ${week}):`);
  shuffled.slice(0, 5).forEach(e => {
    const name = e.employee.name.substring(0, 25).padEnd(25);
    const pattern = e.officeDaysHistory.length > 0 
      ? e.officeDaysHistory.join('-') 
      : 'inicio';
    const arrow = e.officeDaysHistory.length > 0 ? '→' : '';
    console.log(`      ${name} [${pattern}] ${arrow} ${e.targetDays} días`);
  });
  
  // ASIGNACIÓN INICIAL
  for (const empData of shuffled) {
    const { employee, availableDays, targetDays, avoidMonday, seed } = empData;
    
    if (availableDays.length === 0 || targetDays === 0) {
      officeAssignments[employee.id] = [];
      continue;
    }
    
    const context = { avoidMonday, dayCapacity };
    
    let selectedDays = selectBestPattern(availableDays, targetDays, context, seed);
    
    // VALIDACIÓN 1: Conjunto válido
    if (!isValidDaySet(selectedDays)) {
      console.warn(`⚠️ ${employee.name}: Patrón inválido, buscando alternativo...`);
      selectedDays = selectManualBestGaps(availableDays, targetDays, seed);
    }
    
    // VALIDACIÓN 2: Límite de días
    if (selectedDays.length > MAX_OFFICE_DAYS) {
      selectedDays = selectedDays.slice(0, MAX_OFFICE_DAYS);
    }
    
    // Asignar respetando capacidad
    const assigned = [];
    for (const day of selectedDays) {
      if (dayCapacity[day] < OFFICE_CAPACITY) {
        assigned.push(day);
        dayCapacity[day]++;
      }
    }
    
    // VALIDACIÓN FINAL
    if (hasConsecutiveDays(assigned)) {
      console.warn(`⚠️ ${employee.name}: Consecutivos - ${assigned.join(', ')}`);
    }
    
    if (hasViernesLunesViolation(assigned)) {
      console.error(`❌ ${employee.name}: Viernes+Lunes - ${assigned.join(', ')}`);
      
      if (assigned.includes('Viernes') && assigned.includes('Lunes')) {
        const toRemove = dayCapacity['Viernes'] > dayCapacity['Lunes'] ? 'Lunes' : 'Viernes';
        const idx = assigned.indexOf(toRemove);
        assigned.splice(idx, 1);
        dayCapacity[toRemove]--;
      }
    }
    
    officeAssignments[employee.id] = assigned;
  }
  
  // OPTIMIZACIÓN (llenar capacidad sin violar reglas)
  for (let iter = 0; iter < 5; iter++) {
    let changes = 0;
    
    for (const day of WEEK_DAYS) {
      while (dayCapacity[day] < OFFICE_CAPACITY) {
        const candidates = shuffled.filter(empData => {
          const { employee, availableDays } = empData;
          const assigned = officeAssignments[employee.id];
          
          if (!availableDays.includes(day)) return false;
          if (assigned.includes(day)) return false;
          if (assigned.length >= MAX_OFFICE_DAYS) return false;
          
          const testSet = [...assigned, day];
          if (!isValidDaySet(testSet)) return false;
          
          return true;
        });
        
        if (candidates.length === 0) break;
        
        const selected = candidates[0].employee;
        officeAssignments[selected.id].push(day);
        dayCapacity[day]++;
        changes++;
      }
    }
    
    if (changes === 0) break;
  }
  
  // VALIDACIÓN FINAL
  console.log(`\n   🔍 Validación (Semana ${week}):`);
  let totalConsecutive = 0;
  let totalViernesLunes = 0;
  let correctAlternation = 0;
  let totalChecked = 0;
  
  for (const emp of hybridEmployees) {
    const assigned = officeAssignments[emp.id] || [];
    
    if (hasConsecutiveDays(assigned)) {
      totalConsecutive++;
    }
    
    if (hasViernesLunesViolation(assigned)) {
      totalViernesLunes++;
    }
    
    // Verificar alternancia
    const history = employeeOfficeHistory[emp.id] || [];
    if (history.length > 0) {
      const lastWeek = history[history.length - 1];
      const lastWeekDays = Array.isArray(lastWeek) ? lastWeek.length : 0;
      const currentDays = assigned.length;
      
      if (lastWeekDays > 0) {
        totalChecked++;
        if ((lastWeekDays === 2 && currentDays === 3) || (lastWeekDays === 3 && currentDays === 2)) {
          correctAlternation++;
        }
      }
    }
  }
  
  console.log(`      • Consecutivos: ${totalConsecutive}`);
  console.log(`      • Viernes+Lunes: ${totalViernesLunes}`);
  if (totalChecked > 0) {
    const alternationPct = Math.round((correctAlternation / totalChecked) * 100);
    console.log(`      • Alternancia correcta: ${correctAlternation}/${totalChecked} (${alternationPct}%)`);
  }
  
  if (totalConsecutive === 0 && totalViernesLunes === 0) {
    console.log(`      ✅ Perfecto: Sin violaciones`);
  }
  
  return { officeAssignments, dayCapacity };
};

// ==================== REPORTES ====================

const generateQualityReport = (employeeOfficeHistory, hybridEmployees) => {
  const report = {
    consecutiveDays: 0,
    optimalGaps: 0,
    fridayMondayViolations: 0,
    exceedMaxDays: 0,
    underMinDays: 0,
    correctAlternations: 0,
    totalAlternations: 0,
    employeePatterns: [],
    balanceScore: 0
  };
  
  for (const emp of hybridEmployees) {
    const weeks = employeeOfficeHistory[emp.id] || [];
    
    // Patrón de días por semana
    const pattern = weeks.map(w => Array.isArray(w) ? w.length : 0);
    
    // Verificar alternancia
    let alternationCorrect = 0;
    let alternationTotal = 0;
    
    for (let i = 1; i < pattern.length; i++) {
      if (pattern[i] > 0 && pattern[i - 1] > 0) {
        alternationTotal++;
        if (pattern[i] !== pattern[i - 1]) {
          alternationCorrect++;
        }
      }
    }
    
    report.employeePatterns.push({
      employeeId: emp.id,
      employeeName: emp.name,
      pattern: pattern.join('-'),
      alternationCorrect,
      alternationTotal,
      alternationPct: alternationTotal > 0 ? Math.round((alternationCorrect / alternationTotal) * 100) : 0
    });
    
    report.correctAlternations += alternationCorrect;
    report.totalAlternations += alternationTotal;
    
    for (const days of weeks) {
      if (!Array.isArray(days)) continue;
      
      if (hasViernesLunesViolation(days)) {
        report.fridayMondayViolations++;
      }
      
      if (days.length > MAX_OFFICE_DAYS) {
        report.exceedMaxDays++;
      }
      
      if (days.length < MIN_OFFICE_DAYS && days.length > 0) {
        report.underMinDays++;
      }
      
      if (days.length >= 2) {
        const gaps = calculateGaps(days);
        for (const gap of gaps) {
          if (gap === 1) report.consecutiveDays++;
          else if (gap >= 2) report.optimalGaps++;
        }
      }
    }
  }
  
  const totalGaps = report.consecutiveDays + report.optimalGaps;
  let score = totalGaps > 0 ? (report.optimalGaps / totalGaps) * 100 : 100;
  
  score -= report.fridayMondayViolations * 30;
  score -= report.exceedMaxDays * 20;
  score -= report.underMinDays * 10;
  score -= report.consecutiveDays * 5;
  
  // Bonificar alternancia correcta
  if (report.totalAlternations > 0) {
    const alternationPct = (report.correctAlternations / report.totalAlternations);
    score += alternationPct * 20;
  }
  
  report.balanceScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Ordenar por mejor alternancia
  report.employeePatterns.sort((a, b) => b.alternationPct - a.alternationPct);
  
  return report;
};

const validateConfiguration = (month, year, employees) => {
  const errors = [];
  const warnings = [];
  
  if (month < 0 || month > 11) errors.push(`Mes inválido: ${month}`);
  if (year < 2020 || year > 2100) errors.push(`Año inválido: ${year}`);
  if (employees.length === 0) errors.push('No hay empleados activos');
  
  return { errors, warnings, isValid: errors.length === 0 };
};

// ==================== FUNCIÓN PRINCIPAL ====================

export const generateScheduleForMonth = async (month, year) => {
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🗓️  GENERACIÓN CON ALTERNANCIA SIMPLE - ${month + 1}/${year}`);
    console.log(`   ✅ ALTERNANCIA: 2 días → 3 días → 2 días → 3 días...`);
    console.log(`   ❌ SIN DÍAS CONSECUTIVOS`);
    console.log(`   ❌ SIN VIERNES+LUNES`);
    console.log(`${'='.repeat(70)}\n`);
    
    const employees = await prisma.employee.findMany({ 
      where: { labora: 'Si' },
      orderBy: { name: 'asc' }
    });
    
    const validation = validateConfiguration(month, year, employees);
    if (!validation.isValid) {
      validation.errors.forEach(err => console.error(`❌ ${err}`));
      throw new Error(validation.errors.join('; '));
    }
    
    const hybridEmployees = employees.filter(e => e.modalidad === 'Hibrido');
    const enSitioEmployees = employees.filter(e => e.modalidad === 'En Sitio');
    const fullRemoteEmployees = employees.filter(e => e.modalidad === 'Full Remoto');
    const rotatingEmployees = employees.filter(e => e.modalidad === 'Turno Rotativo');
    const otherEmployees = employees.filter(e => 
      !['Full Remoto', 'Turno Rotativo', 'Hibrido', 'En Sitio'].includes(e.modalidad)
    );
    
    console.log('👥 EMPLEADOS:');
    console.log(`   🏢 Híbridos: ${hybridEmployees.length}`);
    console.log(`   🏛️  En Sitio: ${enSitioEmployees.length}`);
    console.log(`   🏠 Full Remoto: ${fullRemoteEmployees.length}`);
    console.log(`   🔄 Turno Rotativo: ${rotatingEmployees.length}`);
    if (otherEmployees.length > 0) console.log(`   ❓ Otros: ${otherEmployees.length}`);
    console.log(`   📊 TOTAL: ${employees.length}\n`);
    
    const holidays = await prisma.holiday.findMany({ where: { month, year } });
    const holidayMap = {};
    holidays.forEach(h => {
      if (!holidayMap[h.week]) holidayMap[h.week] = {};
      holidayMap[h.week][h.day] = h.description;
    });
    
    const vacations = await prisma.vacation.findMany({ 
      where: { month, year },
      include: { employee: true }
    });
    const vacationMap = {};
    vacations.forEach(v => {
      if (!vacationMap[v.employeeId]) vacationMap[v.employeeId] = {};
      if (!vacationMap[v.employeeId][v.week]) vacationMap[v.employeeId][v.week] = {};
      vacationMap[v.employeeId][v.week][v.day] = true;
    });
    
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const recentHistory = await prisma.schedule.findMany({
      where: { month: prevMonth, year: prevYear, week: { gte: 4 } }
    });
    const lastFridayMap = {};
    recentHistory.forEach(s => {
      if (s.day === 'Viernes' && s.status === 'office') {
        lastFridayMap[s.employeeId] = true;
      }
    });
    
    const schedulesToCreate = [];
    const reasonsToCreate = [];
    const employeeOfficeHistory = {};
    
    employees.forEach(emp => { 
      employeeOfficeHistory[emp.id] = [];
    });
    
    const weeklyStats = [];
    
    console.log('📅 GENERANDO HORARIOS:\n');
    
    for (let w = 1; w <= WEEKS_IN_MONTH; w++) {
      console.log(`   ━━━ Semana ${w}/${WEEKS_IN_MONTH} ━━━`);
      
      // EN SITIO
      for (const emp of enSitioEmployees) {
        for (const day of WEEK_DAYS) {
          if (vacationMap[emp.id]?.[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Vacaciones', month, year });
          } else if (holidayMap[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Asueto / Feriado', month, year });
          } else {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'office', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'En sitio', month, year });
          }
        }
      }
      
      // FULL REMOTO
      for (const emp of fullRemoteEmployees) {
        for (const day of WEEK_DAYS) {
          if (vacationMap[emp.id]?.[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Vacaciones', month, year });
          } else if (holidayMap[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Asueto / Feriado', month, year });
          } else {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'home', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Home Office', month, year });
          }
        }
      }
      
      // TURNO ROTATIVO
      const isHomeWeek = w % 2 !== 0;
      for (const emp of rotatingEmployees) {
        for (const day of WEEK_DAYS) {
          if (vacationMap[emp.id]?.[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Vacaciones', month, year });
          } else if (holidayMap[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Asueto / Feriado', month, year });
          } else {
            schedulesToCreate.push({ 
              employeeId: emp.id, 
              week: w, 
              day, 
              status: isHomeWeek ? 'home' : 'office', 
              month, 
              year 
            });
            if (isHomeWeek) {
              reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Home Office', month, year });
            }
          }
        }
      }
      
      // HÍBRIDO - Alternancia simple
      if (hybridEmployees.length > 0) {
        const { officeAssignments, dayCapacity } = intelligentBalancing(
          hybridEmployees,
          enSitioEmployees,
          w,
          holidayMap,
          vacationMap,
          lastFridayMap,
          employeeOfficeHistory
        );
        
        const weekStat = { week: w, days: {}, distribution: { min: OFFICE_CAPACITY, max: 0, avg: 0 } };
        let totalCapacity = 0;
        
        WEEK_DAYS.forEach(day => { 
          const count = dayCapacity[day];
          weekStat.days[day] = count;
          weekStat.distribution.min = Math.min(weekStat.distribution.min, count);
          weekStat.distribution.max = Math.max(weekStat.distribution.max, count);
          totalCapacity += count;
        });
        weekStat.distribution.avg = (totalCapacity / WEEK_DAYS.length).toFixed(1);
        weeklyStats.push(weekStat);
        
        console.log(`   📊 Distribución:`);
        WEEK_DAYS.forEach((day) => {
          const total = dayCapacity[day];
          const pct = Math.round((total / OFFICE_CAPACITY) * 100);
          const icon = total === OFFICE_CAPACITY ? '✅' : 
                       total >= OFFICE_CAPACITY * 0.85 ? '🟢' : 
                       total >= OFFICE_CAPACITY * 0.7 ? '🟡' : '🟠';
          
          console.log(`      ${icon} ${day.padEnd(10)} ${String(total).padStart(2)}/${OFFICE_CAPACITY} (${String(pct).padStart(3)}%)`);
        });
        
        for (const emp of hybridEmployees) {
          const officeDays = officeAssignments[emp.id] || [];
          
          employeeOfficeHistory[emp.id].push(officeDays);
          
          for (const day of WEEK_DAYS) {
            if (vacationMap[emp.id]?.[w]?.[day]) {
              schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
              reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Vacaciones', month, year });
            } else if (holidayMap[w]?.[day]) {
              schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
              reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Asueto / Feriado', month, year });
            } else if (officeDays.includes(day)) {
              schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'office', month, year });
            } else {
              schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'home', month, year });
              reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Home Office', month, year });
            }
          }
        }
      }
      
      // OTROS
      for (const emp of otherEmployees) {
        for (const day of WEEK_DAYS) {
          if (vacationMap[emp.id]?.[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Vacaciones', month, year });
          } else if (holidayMap[w]?.[day]) {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'holiday', month, year });
            reasonsToCreate.push({ employeeId: emp.id, week: w, day, reason: 'Asueto / Feriado', month, year });
          } else {
            schedulesToCreate.push({ employeeId: emp.id, week: w, day, status: 'office', month, year });
          }
        }
      }
      
      console.log();
    }
    
    const qualityReport = generateQualityReport(employeeOfficeHistory, hybridEmployees);
    
    console.log(`${'='.repeat(70)}`);
    console.log('💾 GUARDANDO...\n');
    
    await prisma.$transaction(async (tx) => {
      await tx.schedule.deleteMany({ where: { month, year } });
      await tx.dayReason.deleteMany({ where: { month, year } });
      await tx.schedule.createMany({ data: schedulesToCreate, skipDuplicates: true });
      await tx.dayReason.createMany({ data: reasonsToCreate, skipDuplicates: true });
    });
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ COMPLETADO');
    console.log(`${'='.repeat(70)}\n`);
    
    console.log('🎯 RESUMEN:\n');
    
    if (qualityReport.consecutiveDays === 0) {
      console.log('   ✅ PERFECTO: 0 días consecutivos');
    } else {
      console.log(`   ⚠️  ${qualityReport.consecutiveDays} días consecutivos`);
    }
    
    if (qualityReport.fridayMondayViolations === 0) {
      console.log('   ✅ PERFECTO: 0 violaciones Viernes+Lunes');
    } else {
      console.log(`   ❌ ${qualityReport.fridayMondayViolations} violaciones Viernes+Lunes`);
    }
    
    if (qualityReport.totalAlternations > 0) {
      const alternationPct = Math.round((qualityReport.correctAlternations / qualityReport.totalAlternations) * 100);
      console.log(`   🔄 Alternancia: ${qualityReport.correctAlternations}/${qualityReport.totalAlternations} (${alternationPct}%)`);
    }
    
    console.log(`\n   📊 Score: ${qualityReport.balanceScore}/100`);
    
    console.log('\n   📋 TOP 10 PATRONES DE ALTERNANCIA:\n');
    qualityReport.employeePatterns.slice(0, 10).forEach((emp, idx) => {
      const icon = emp.alternationPct >= 75 ? '✅' : emp.alternationPct >= 50 ? '🟡' : '⚠️';
      console.log(`      ${idx + 1}. ${icon} ${emp.employeeName.substring(0, 25).padEnd(25)} [${emp.pattern}] ${emp.alternationPct}%`);
    });
    
    console.log('\n   ⏱️  Tiempo: ' + executionTime + 's\n');
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      message: `Horario generado para ${employees.length} empleados`,
      schedulesCreated: schedulesToCreate.length,
      reasonsCreated: reasonsToCreate.length,
      executionTime: parseFloat(executionTime),
      quality: {
        score: qualityReport.balanceScore,
        consecutiveDays: qualityReport.consecutiveDays,
        correctAlternations: qualityReport.correctAlternations,
        totalAlternations: qualityReport.totalAlternations,
        alternationPct: qualityReport.totalAlternations > 0 
          ? Math.round((qualityReport.correctAlternations / qualityReport.totalAlternations) * 100)
          : 0,
        violations: {
          fridayMonday: qualityReport.fridayMondayViolations,
          consecutive: qualityReport.consecutiveDays,
          exceedMax: qualityReport.exceedMaxDays
        }
      }
    };
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(`   ${error.message}\n`);
    throw error;
  }
};

export {
  seededRandom,
  shuffleArray,
  generateSeed,
  isValidDaySet,
  hasConsecutiveDays,
  hasViernesLunesViolation,
  selectBestPattern,
  getSimpleAlternation,
  generateQualityReport,
  validateConfiguration,
  SAFE_PATTERNS
};