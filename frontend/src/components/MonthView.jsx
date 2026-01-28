// frontend/src/components/MonthView.jsx
import React, { useState, useMemo } from 'react';
import ScheduleCell from './ScheduleCell';
import { getWorkDaysInMonth, getDayOfWeek, getWeekFromDate } from '../utils/dateUtils';
import { countHomeDaysInMonth } from '../utils/scheduleUtils';

const MonthView = ({ 
  employees,
  schedule,
  dayReasons,
  holidays,
  currentMonth,
  currentYear,
  onCellClick
}) => {
  // ==================== ESTADOS ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'modality', 'homeOffice', 'place'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [expandedView, setExpandedView] = useState(false);
  const [highlightedEmployee, setHighlightedEmployee] = useState(null);

  const monthDays = getWorkDaysInMonth(currentYear, currentMonth);

  // ==================== UTILIDADES ====================
  
  const getReasonName = (empId, week, day) => {
    const reasonKey = `${empId}-${week}-${day}`;
    return dayReasons[reasonKey] || null;
  };

  const isDateHoliday = (day) => {
    if (!day) return false;
    
    const dayName = getDayOfWeek(currentYear, currentMonth, day);
    const week = getWeekFromDate(currentYear, currentMonth, day);
    
    if (holidays[week] && holidays[week][dayName]) {
      return { description: holidays[week][dayName].description };
    }
    
    return false;
  };

  // ==================== FILTRADO Y ORDENAMIENTO ====================

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees];

    // 1. Filtrar por búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.officePlaceNumber?.toString().includes(term)
      );
    }

    // 2. Filtrar por modalidad
    if (modalityFilter !== 'all') {
      filtered = filtered.filter(emp => emp.modalidad === modalityFilter);
    }

    // 3. Ordenar
    filtered.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'modality':
          compareA = a.modalidad || '';
          compareB = b.modalidad || '';
          break;
        case 'homeOffice':
          compareA = countHomeDaysInMonth(schedule, a.id, monthDays);
          compareB = countHomeDaysInMonth(schedule, b.id, monthDays);
          break;
        case 'place':
          compareA = a.officePlaceNumber || 0;
          compareB = b.officePlaceNumber || 0;
          break;
        default:
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchTerm, modalityFilter, sortBy, sortOrder, schedule, monthDays]);

  // ==================== ESTADÍSTICAS ====================

  const statistics = useMemo(() => {
    const stats = {
      total: filteredAndSortedEmployees.length,
      byModality: {},
      avgHomeOffice: 0,
      maxHomeOffice: 0,
      minHomeOffice: Infinity
    };

    let totalHO = 0;

    filteredAndSortedEmployees.forEach(emp => {
      // Contar por modalidad
      const modality = emp.modalidad || 'Sin modalidad';
      stats.byModality[modality] = (stats.byModality[modality] || 0) + 1;

      // Calcular estadísticas de HO
      const hoCount = countHomeDaysInMonth(schedule, emp.id, monthDays);
      totalHO += hoCount;
      stats.maxHomeOffice = Math.max(stats.maxHomeOffice, hoCount);
      stats.minHomeOffice = Math.min(stats.minHomeOffice, hoCount);
    });

    stats.avgHomeOffice = filteredAndSortedEmployees.length > 0 
      ? (totalHO / filteredAndSortedEmployees.length).toFixed(1)
      : 0;

    if (stats.minHomeOffice === Infinity) stats.minHomeOffice = 0;

    return stats;
  }, [filteredAndSortedEmployees, schedule, monthDays]);

  // ==================== HANDLERS ====================

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setModalityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleEmployeeHover = (empId) => {
    setHighlightedEmployee(empId);
  };

  const handleEmployeeLeave = () => {
    setHighlightedEmployee(null);
  };

  // ==================== MODALIDADES DISPONIBLES ====================

  const availableModalities = useMemo(() => {
    const modalities = new Set();
    employees.forEach(emp => {
      if (emp.modalidad) modalities.add(emp.modalidad);
    });
    return Array.from(modalities).sort();
  }, [employees]);

  // ==================== RENDER ====================

  return (
    <div style={styles.container}>
      {/* BARRA DE HERRAMIENTAS */}
      <div style={styles.toolbar}>
        {/* Búsqueda */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, puesto o lugar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={styles.filtersContainer}>
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">📋 Todas las modalidades</option>
            {availableModalities.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            style={styles.select}
          >
            <option value="name">Ordenar: Nombre</option>
            <option value="modality">Ordenar: Modalidad</option>
            <option value="homeOffice">Ordenar: Días HO</option>
            <option value="place">Ordenar: Lugar</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={styles.sortOrderBtn}
            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <button
            onClick={() => setExpandedView(!expandedView)}
            style={styles.viewBtn}
            title={expandedView ? 'Vista compacta' : 'Vista expandida'}
          >
            {expandedView ? '📏' : '📐'}
          </button>

          {(searchTerm || modalityFilter !== 'all' || sortBy !== 'name') && (
            <button
              onClick={clearFilters}
              style={styles.clearBtn}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Empleados</div>
          <div style={styles.statValue}>{statistics.total}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Promedio HO</div>
          <div style={styles.statValue}>{statistics.avgHomeOffice} días</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Rango HO</div>
          <div style={styles.statValue}>
            {statistics.minHomeOffice} - {statistics.maxHomeOffice}
          </div>
        </div>

        {Object.entries(statistics.byModality).map(([mod, count]) => (
          <div key={mod} style={styles.statCard}>
            <div style={styles.statLabel}>{mod}</div>
            <div style={styles.statValue}>{count}</div>
          </div>
        ))}
      </div>

      {/* RESULTADOS */}
      {filteredAndSortedEmployees.length === 0 ? (
        <div style={styles.noResults}>
          <div style={styles.noResultsIcon}>🔍</div>
          <div style={styles.noResultsText}>
            No se encontraron empleados con los filtros seleccionados
          </div>
          <button onClick={clearFilters} style={styles.noResultsBtn}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={{
            ...styles.table,
            fontSize: expandedView ? '13px' : '11px'
          }}>
            <thead>
              {/* Fila 1: Números de días */}
              <tr>
                <th 
                  style={{
                    ...styles.thFixed,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  colSpan={3}
                  onClick={() => handleSort('name')}
                  title="Click para ordenar por nombre"
                >
                  Empleado {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                {monthDays.map(d => (
                  <th 
                    key={`day-num-${d.day}`} 
                    style={{
                      ...styles.thDay,
                      backgroundColor: isDateHoliday(d.day) ? '#fef3c7' : '#f3f4f6',
                      fontSize: expandedView ? '11px' : '9px'
                    }}
                  >
                    {d.day}
                  </th>
                ))}
                <th 
                  style={{
                    ...styles.thTotal,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('homeOffice')}
                  title="Click para ordenar por días HO"
                >
                  Total HO {sortBy === 'homeOffice' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>

              {/* Fila 2: Nombres de días */}
              <tr>
                <th style={styles.thSubHeader}>
                  <span 
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('modality')}
                    title="Click para ordenar por modalidad"
                  >
                    Modalidad {sortBy === 'modality' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </span>
                </th>
                <th style={styles.thSubHeader}>
                  <span 
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('place')}
                    title="Click para ordenar por lugar"
                  >
                    Lugar {sortBy === 'place' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </span>
                </th>
                <th style={styles.thSubHeader}>Puesto</th>
                {monthDays.map(d => {
                  const isDayHoliday = isDateHoliday(d.day);
                  return (
                    <th 
                      key={`day-name-${d.day}`} 
                      style={{
                        ...styles.thDay,
                        backgroundColor: isDayHoliday ? '#fef3c7' : '#f3f4f6',
                        fontSize: expandedView ? '10px' : '9px',
                        fontWeight: 'normal'
                      }}
                      title={isDayHoliday ? `Asueto: ${isDayHoliday.description}` : d.dayName}
                    >
                      {isDayHoliday ? '🎉' : d.dayName.substring(0, 2)}
                    </th>
                  );
                })}
                <th style={styles.thTotal}></th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedEmployees.map((emp, index) => {
                const isHighlighted = highlightedEmployee === emp.id;
                const hoCount = countHomeDaysInMonth(schedule, emp.id, monthDays);
                
                return (
                  <tr 
                    key={emp.id} 
                    style={{
                      ...styles.tr,
                      backgroundColor: isHighlighted 
                        ? '#fef3c7' 
                        : index % 2 === 0 ? 'white' : '#f9fafb'
                    }}
                    onMouseEnter={() => handleEmployeeHover(emp.id)}
                    onMouseLeave={handleEmployeeLeave}
                  >
                    {/* Columna: Nombre */}
                    <td style={{
                      ...styles.tdName,
                      fontSize: expandedView ? '13px' : '11px',
                      backgroundColor: isHighlighted ? '#fef3c7' : 'inherit'
                    }}>
                      <div style={styles.employeeName}>{emp.name}</div>
                    </td>

                    {/* Columna: Modalidad */}
                    <td style={{
                      ...styles.tdSmall,
                      backgroundColor: isHighlighted ? '#fef3c7' : 'inherit'
                    }}>
                      <span style={getModalityBadgeStyle(emp.modalidad)}>
                        {getModalityIcon(emp.modalidad)}
                      </span>
                    </td>

                    {/* Columna: Lugar */}
                    <td style={{
                      ...styles.tdSmall,
                      backgroundColor: isHighlighted ? '#fef3c7' : 'inherit'
                    }}>
                      <span style={styles.placeNumber}>
                        {emp.officePlaceNumber || '-'}
                      </span>
                    </td>

                    {/* Columna: Puesto */}
                    {/* <td style={{
                      ...styles.tdPosition,
                      backgroundColor: isHighlighted ? '#fef3c7' : 'inherit'
                    }}>
                      <div style={styles.positionText}>
                        {emp.position || '-'}
                      </div>
                    </td> */}
                    
                    {/* Días del mes */}
                    {monthDays.map(d => {
                      const status = schedule[emp.id]?.[d.week]?.[d.dayName];
                      const reasonName = getReasonName(emp.id, d.week, d.dayName);

                      return (
                        <ScheduleCell
                          key={`${emp.id}-${d.day}`}
                          status={status}
                          reasonName={reasonName}
                          officePlaceNumber={emp.officePlaceNumber}
                          onClick={() => onCellClick(emp.id, d.week, d.dayName)}
                          isMonthView={true}
                        />
                      );
                    })}
                    
                    {/* Total HO */}
                    <td style={{
                      ...styles.tdTotal,
                      backgroundColor: getHOColor(hoCount),
                      color: hoCount > 13 ? 'white' : '#000'
                    }}>
                      <strong>{hoCount}</strong>
                      {hoCount > 13 && ' ⚠️'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* LEYENDA */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>Leyenda:</div>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendBox, backgroundColor: '#34d399'}}></div>
            <span>Oficina</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendBox, backgroundColor: '#60a5fa'}}></div>
            <span>Home Office</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendBox, backgroundColor: '#fbbf24'}}></div>
            <span>Asueto/Feriado</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendBox, backgroundColor: '#f87171'}}></div>
            <span>Vacaciones</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendBox, backgroundColor: '#e5e7eb'}}></div>
            <span>Sin asignar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== FUNCIONES AUXILIARES ====================

const getModalityIcon = (modality) => {
  const icons = {
    'Hibrido': '🔄',
    'En Sitio': '🏢',
    'Full Remoto': '🏠',
    'Turno Rotativo': '⚡'
  };
  return icons[modality] || '❓';
};

const getModalityBadgeStyle = (modality) => {
  const colors = {
    'Hibrido': { bg: '#dbeafe', color: '#1e40af' },
    'En Sitio': { bg: '#d1fae5', color: '#065f46' },
    'Full Remoto': { bg: '#fce7f3', color: '#9f1239' },
    'Turno Rotativo': { bg: '#fef3c7', color: '#92400e' }
  };
  
  const style = colors[modality] || { bg: '#e5e7eb', color: '#374151' };
  
  return {
    fontSize: '16px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: style.bg,
    display: 'inline-block'
  };
};

const getHOColor = (count) => {
  if (count > 13) return '#ef4444'; // Rojo - excede límite
  if (count >= 12) return '#fbbf24'; // Amarillo - cerca del límite
  if (count >= 10) return '#34d399'; // Verde - normal
  return '#93c5fd'; // Azul - bajo
};

// ==================== ESTILOS ====================

const styles = {
  container: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
  },

  // TOOLBAR
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },

  searchContainer: {
    position: 'relative',
    width: '100%',
  },

  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 12px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },

  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px 8px',
  },

  filtersContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  select: {
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },

  sortOrderBtn: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  viewBtn: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },

  clearBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#ef4444',
    cursor: 'pointer',
    fontWeight: '500',
  },

  // ESTADÍSTICAS
  statsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },

  statCard: {
    backgroundColor: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    minWidth: '120px',
    textAlign: 'center',
  },

  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '500',
  },

  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
  },

  // NO RESULTS
  noResults: {
    backgroundColor: 'white',
    padding: '60px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },

  noResultsIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },

  noResultsText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '20px',
  },

  noResultsBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500',
  },

  // TABLA
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },

  table: {
    width: '100%',
    minWidth: '1200px',
    borderCollapse: 'collapse',
  },

  thFixed: {
    border: '1px solid #e5e7eb',
    padding: '12px 8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    position: 'sticky',
    left: 0,
    zIndex: 3,
  },

  thSubHeader: {
    border: '1px solid #e5e7eb',
    padding: '8px 6px',
    backgroundColor: '#e5e7eb',
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: '600',
    position: 'sticky',
    left: 0,
    zIndex: 2,
  },

  thDay: {
    border: '1px solid #e5e7eb',
    padding: '6px 2px',
    textAlign: 'center',
    fontSize: '10px',
    width: '32px',
    minWidth: '32px',
  },

  thTotal: {
    border: '1px solid #e5e7eb',
    padding: '10px',
    backgroundColor: '#34d399',
    color: 'white',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '70px',
    position: 'sticky',
    right: 0,
    zIndex: 2,
  },

  tr: {
    transition: 'background-color 0.15s',
  },

  tdName: {
    border: '1px solid #e5e7eb',
    padding: '10px 8px',
    textAlign: 'left',
    fontWeight: '600',
    minWidth: '180px',
    position: 'sticky',
    left: 0,
    zIndex: 1,
    backgroundColor: 'white',
  },

  employeeName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  tdSmall: {
    border: '1px solid #e5e7eb',
    padding: '8px 4px',
    textAlign: 'center',
    fontSize: '11px',
    minWidth: '60px',
    position: 'sticky',
    left: '180px',
    zIndex: 1,
    backgroundColor: 'white',
  },

  tdPosition: {
    border: '1px solid #e5e7eb',
    padding: '8px 6px',
    textAlign: 'left',
    fontSize: '10px',
    maxWidth: '120px',
    position: 'sticky',
    left: '300px',
    zIndex: 1,
    backgroundColor: 'white',
  },

  positionText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#6b7280',
  },

  placeNumber: {
    fontWeight: 'bold',
    fontSize: '12px',
  },

  tdTotal: {
    border: '1px solid #e5e7eb',
    padding: '8px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '70px',
    position: 'sticky',
    right: 0,
    zIndex: 1,
  },

  // LEYENDA
  legend: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },

  legendTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#374151',
  },

  legendItems: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6b7280',
  },

  legendBox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
  },
};

export default MonthView;