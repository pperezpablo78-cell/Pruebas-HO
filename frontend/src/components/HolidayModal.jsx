// frontend/src/components/HolidayModal.jsx
import React, { useState } from 'react';
import { Save, Trash2, Calendar } from 'lucide-react';
import Modal from './Modal';
import { getDayOfWeek, getWeekFromDate } from '../utils/dateUtils';
import { MONTH_NAMES, DAYS_OF_WEEK } from '../utils/constants';

const HolidayModal = ({ 
  isOpen, 
  onClose, 
  currentMonth, 
  currentYear, 
  holidays,
  onSave,
  onDelete 
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [description, setDescription] = useState('');

  // ✅ Calcular automáticamente día y semana cuando se selecciona una fecha
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);

    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const monthName = MONTH_NAMES[month - 1];
      setDescription(`Asueto ${day} de ${monthName}`);
    }
  };

  const handleSave = () => {
    if (!selectedDate || !description.trim()) {
      alert('Por favor selecciona una fecha e ingresa una descripción');
      return;
    }

    // ✅ EXTRAER AUTOMÁTICAMENTE todos los datos de la fecha
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Verificar que sea día laborable (Lunes a Viernes)
    const dayOfWeek = date.getDay(); // 0=Domingo, 6=Sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert('Solo puedes marcar días laborables (Lunes a Viernes) como asueto');
      return;
    }

    // Calcular el día de la semana en español
    const dayName = DAYS_OF_WEEK[dayOfWeek];
    
    // Calcular la semana del mes
    const week = getWeekFromDate(year, month - 1, day);

    console.log('📅 Datos calculados:', {
      fecha: selectedDate,
      week,
      dayName,
      month: month - 1,
      year
    });

    // ✅ Enviar con todos los datos calculados automáticamente
    onSave({
      week: week,
      day: dayName,
      description: description.trim(),
      month: month - 1, // Convertir de 1-12 a 0-11
      year: year
    });
    
    setSelectedDate('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Asueto / Feriado"
      footer={
        <button 
          onClick={handleSave} 
          style={styles.btnSave}
          disabled={!selectedDate || !description.trim()}
        >
          <Save size={16} /> Confirmar Asueto
        </button>
      }
    >
      <div style={styles.formSection}>
        <label style={styles.label}>
          <Calendar size={16} style={{display: 'inline', marginRight: '5px'}} />
          Fecha del Asueto
        </label>
        <input 
          type="date" 
          value={selectedDate}
          onChange={handleDateChange}
          min={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`}
          max={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`}
          style={styles.dateInput}
        />
        <p style={styles.hint}>
          Solo se permiten días laborables (Lunes a Viernes)
        </p>
      </div>

      {selectedDate && (
        <div style={styles.formSection}>
          <label style={styles.label}>Descripción del Asueto</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={styles.input}
            placeholder="Ej: Día de Reyes, Semana Santa, etc."
          />
          
          {/* Preview de lo que se va a guardar */}
          <div style={styles.preview}>
            <strong>Vista previa:</strong>
            <br />
            📅 Fecha: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            <br />
            📝 Descripción: {description}
          </div>
        </div>
      )}
      
      <div style={styles.divider} />
      
      <h4 style={styles.sectionTitle}>Asuetos Registrados en {MONTH_NAMES[currentMonth]}:</h4>
      <ul style={styles.holidayList}>
        {Object.keys(holidays).length === 0 ? (
          <li style={styles.emptyMessage}>No hay asuetos registrados este mes</li>
        ) : (
          Object.keys(holidays).map(week => (
            Object.keys(holidays[week]).map(day => {
              const holiday = holidays[week][day];
              return (
                <li key={`${week}-${day}`} style={styles.holidayItem}>
                  <div style={styles.holidayInfo}>
                    <span style={styles.holidayDay}>
                      {day} - Semana {week}
                    </span>
                    <span style={styles.holidayDesc}>{holiday.description}</span>
                  </div>
                  <button 
                    onClick={() => onDelete(holiday.id)} 
                    style={styles.btnDelete}
                    title="Eliminar asueto"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })
          ))
        )}
      </ul>
    </Modal>
  );
};

const styles = {
  formSection: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#374151',
  },
  dateInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  input: {
    width: 'calc(100% - 22px)',
    padding: '10px',
    borderRadius: '6px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '5px',
    fontStyle: 'italic',
  },
  preview: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '20px 0',
  },
  sectionTitle: {
    marginBottom: '12px',
    fontSize: '14px',
    color: '#374151',
  },
  holidayList: {
    listStyleType: 'none',
    padding: 0,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  emptyMessage: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    padding: '20px',
  },
  holidayItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #fef3c7',
    backgroundColor: '#fffbeb',
    marginBottom: '8px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  holidayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  holidayDay: {
    fontWeight: '600',
    color: '#92400e',
  },
  holidayDesc: {
    color: '#78350f',
  },
  btnDelete: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s',
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
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
};

export default HolidayModal;