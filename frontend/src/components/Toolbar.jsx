// frontend/src/components/Toolbar.jsx
import React from 'react';
import { Plus, RefreshCw, Download, Calendar } from 'lucide-react';

const Toolbar = ({ 
  viewMode,
  currentWeek,
  onWeekChange,
  onAddEmployee,
  onAddHoliday,
  onGenerateSchedule,
  onExport
}) => {
  return (
    <div style={styles.toolbar}>
      {viewMode === 'week' && (
        <div style={styles.weekSelector}>
          <label>Semana:</label>
          <select
            value={currentWeek}
            onChange={(e) => onWeekChange(parseInt(e.target.value))}
            style={styles.selectSmall}
          >
            {[1, 2, 3, 4, 5].map(w => (
              <option key={w} value={w}>Semana {w}</option>
            ))}
          </select>
        </div>
      )}
      
      <div style={styles.toolbarActions}>
        <button onClick={onAddEmployee} style={styles.btnAdd}>
          <Plus size={16} /> Agregar Empleado
        </button>
        
        <button onClick={onAddHoliday} style={styles.btnAdd}>
          <Calendar size={16} /> Agregar Asueto
        </button>
        
        <button onClick={onGenerateSchedule} style={styles.btnRefresh} title="Generar Horario Automático">
          <RefreshCw size={16} /> Generar Horario
        </button>
        
        <button onClick={onExport} style={styles.btnDownload} title="Exportar a Excel">
          <Download size={16} /> Exportar
        </button>
      </div>
    </div>
  );
};

const styles = {
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  weekSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
  },
  selectSmall: {
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '12px',
  },
  toolbarActions: {
    display: 'flex',
    gap: '10px',
  },
  btnAdd: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
  },
  btnRefresh: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#f59e0b',
    color: 'white',
    cursor: 'pointer',
  },
  btnDownload: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    cursor: 'pointer',
  },
};

export default Toolbar;