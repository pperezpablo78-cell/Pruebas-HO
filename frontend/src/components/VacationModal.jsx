// frontend/src/components/VacationModal.jsx
import React, { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { generateCalendar, getDayOfWeek, getWeekFromDate } from '../utils/dateUtils';
import { MONTH_NAMES } from '../utils/constants';

const VacationModal = ({ 
  isOpen, 
  onClose, 
  employee,
  currentMonth, 
  currentYear, 
  vacations,
  holidays,
  onSave,
  onDelete 
}) => {
  const [selectedDays, setSelectedDays] = useState([]);

  const calendar = generateCalendar(currentYear, currentMonth);

  const handleDayClick = (day) => {
    if (!day) return;
    
    const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
    if (dayOfWeek === 'Sábado' || dayOfWeek === 'Domingo') {
      alert('Solo puedes marcar días laborables (Lunes a Viernes) como vacaciones');
      return;
    }

    // ✅ Verificar si es día festivo
    const week = getWeekFromDate(currentYear, currentMonth, day);
    const isHoliday = holidays[week]?.[dayOfWeek];
    
    if (isHoliday) {
      alert(`Este día es festivo: ${isHoliday.description || 'Asueto'}`);
      return;
    }
    
    // Verificar si ya está seleccionado
    const existing = selectedDays.find(d => d.day === day);
    if (existing) {
      setSelectedDays(selectedDays.filter(d => d.day !== day));
    } else {
      setSelectedDays([...selectedDays, { day, dayOfWeek, week }]);
    }
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      alert('Por favor selecciona al menos un día de vacaciones');
      return;
    }

    // Convertir a formato esperado por el backend
    const vacationDays = selectedDays.map(d => ({
      week: d.week,
      day: d.dayOfWeek
    }));

    onSave(employee.id, vacationDays);
    setSelectedDays([]);
  };

  const handleDeleteAll = () => {
    if (window.confirm(`¿Eliminar todas las vacaciones de ${employee?.name} en ${MONTH_NAMES[currentMonth]}?`)) {
      onDelete(employee.id);
    }
  };

  const isDateVacation = (day) => {
    if (!day || !employee) return false;
    const dayName = getDayOfWeek(currentYear, currentMonth, day);
    const week = getWeekFromDate(currentYear, currentMonth, day);
    return vacations[employee.id]?.[week]?.[dayName];
  };

  const isDateHoliday = (day) => {
    if (!day) return false;
    const dayName = getDayOfWeek(currentYear, currentMonth, day);
    const week = getWeekFromDate(currentYear, currentMonth, day);
    return holidays[week]?.[dayName];
  };

  const isDateSelected = (day) => {
    return selectedDays.some(d => d.day === day);
  };

  const getExistingVacationCount = () => {
    if (!employee || !vacations[employee.id]) return 0;
    let count = 0;
    Object.keys(vacations[employee.id]).forEach(week => {
      count += Object.keys(vacations[employee.id][week]).length;
    });
    return count;
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vacaciones de ${employee.name} - ${MONTH_NAMES[currentMonth]} ${currentYear}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {getExistingVacationCount() > 0 && (
            <button onClick={handleDeleteAll} style={styles.btnDelete}>
              <Trash2 size={16} /> Eliminar Todas
            </button>
          )}
          <button 
            onClick={handleSave} 
            style={styles.btnSave}
            disabled={selectedDays.length === 0}
          >
            <Save size={16} /> Guardar Vacaciones
          </button>
        </div>
      }
    >
      <p style={{marginBottom: '10px'}}>
        Selecciona los días de vacaciones en el calendario (solo Lunes a Viernes):
      </p>

      <div style={styles.info}>
        <div>📅 Días seleccionados: <strong>{selectedDays.length}</strong></div>
        <div>🏖️ Vacaciones existentes: <strong>{getExistingVacationCount()}</strong></div>
      </div>

      <div style={styles.calendarGrid}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} style={styles.calendarDayHeader}>{day}</div>
        ))}
        {calendar.flat().map((day, index) => {
          const isCurrentMonthDay = day !== null;
          const isVacation = isDateVacation(day);
          const isHoliday = isDateHoliday(day);
          const isSelected = isDateSelected(day);
          const dayOfWeek = day ? getDayOfWeek(currentYear, currentMonth, day) : null;
          const isWeekend = dayOfWeek === 'Sábado' || dayOfWeek === 'Domingo';
          
          // ✅ MEJORADO: Estilos más claros para días festivos
          let backgroundColor = '#f3f4f6';
          let borderColor = '#eee';
          let opacity = 1;
          
          if (!isCurrentMonthDay) {
            backgroundColor = '#f3f4f6';
            opacity = 0.3;
          } else if (isWeekend) {
            backgroundColor = '#f3f4f6';
            opacity = 0.5;
          } else if (isHoliday) {
            // ⭐ Días festivos: amarillo con patrón diagonal
            backgroundColor = '#fef3c7';
            borderColor = '#f59e0b';
            opacity = 0.7; // Más transparente para que se vea "no disponible"
          } else if (isSelected) {
            backgroundColor = '#93c5fd'; // Azul claro seleccionado
            borderColor = '#3b82f6';
          } else if (isVacation) {
            backgroundColor = '#d1d5db'; // Gris vacaciones existentes
            borderColor = '#6b7280';
          } else {
            backgroundColor = '#ffffff';
          }

          const isClickable = isCurrentMonthDay && !isWeekend && !isHoliday && !isVacation;

          return (
            <div 
              key={index} 
              style={{
                ...styles.calendarDay,
                backgroundColor,
                border: `2px solid ${borderColor}`,
                opacity,
                cursor: isClickable ? 'pointer' : 'not-allowed',
                // ⭐ Patrón diagonal para días festivos
                backgroundImage: isHoliday ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)' : 'none',
                transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
              onClick={() => isClickable && handleDayClick(day)}
              onMouseEnter={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isSelected ? 'scale(0.95)' : 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={
                isVacation ? 'Vacaciones ya programadas (no modificable aquí)' :
                isHoliday ? `Día festivo: ${isHoliday.description || 'Asueto'} (no disponible)` :
                isWeekend ? 'Fin de semana (no disponible)' :
                isSelected ? 'Click para deseleccionar' :
                isCurrentMonthDay ? 'Click para seleccionar' : ''
              }
            >
              <strong>{day}</strong>
              {isVacation && <div style={{fontSize: '10px', marginTop: '2px'}}>🏖️</div>}
              {isHoliday && <div style={{fontSize: '10px', marginTop: '2px'}}>🎉</div>}
              {isSelected && <div style={{fontSize: '12px', marginTop: '2px', fontWeight: 'bold'}}>✓</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#93c5fd', border: '2px solid #3b82f6'}}></div>
          <span>Seleccionado</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#d1d5db', border: '2px solid #6b7280'}}></div>
          <span>Vacaciones existentes</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendColor, 
            backgroundColor: '#fef3c7', 
            border: '2px solid #f59e0b',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(251, 191, 36, 0.2) 5px, rgba(251, 191, 36, 0.2) 10px)',
            opacity: 0.7
          }}></div>
          <span>Día festivo (no disponible)</span>
        </div>
      </div>

      {selectedDays.length > 0 && (
        <div style={styles.selectedList}>
          <h4 style={{marginTop: 0, marginBottom: '10px'}}>Días seleccionados:</h4>
          <div style={styles.chips}>
            {selectedDays.map((d, idx) => (
              <div key={idx} style={styles.chip}>
                {d.dayOfWeek} {d.day}
                <button 
                  onClick={() => setSelectedDays(selectedDays.filter((_, i) => i !== idx))}
                  style={styles.chipDelete}
                  title="Quitar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

const styles = {
  info: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
    marginBottom: '15px',
  },
  calendarDayHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '5px',
    backgroundColor: '#e5e7eb',
    fontSize: '12px',
    borderRadius: '4px',
  },
  calendarDay: {
    padding: '8px 5px',
    textAlign: 'center',
    fontSize: '13px',
    minHeight: '45px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '6px',
    userSelect: 'none',
  },
  legend: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '12px',
    gap: '10px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendColor: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  selectedList: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
  },
  chipDelete: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: '1',
    fontWeight: 'bold',
  },
  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    marginLeft: 'auto',
    fontSize: '14px',
    fontWeight: '500',
  },
  btnDelete: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default VacationModal;