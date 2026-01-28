// frontend/src/components/Header.jsx
import React from 'react';
import { Calendar } from 'lucide-react';
import { MONTH_NAMES } from '../utils/constants';

const Header = ({ 
  currentMonth, 
  currentYear, 
  viewMode, 
  onMonthChange, 
  onYearChange, 
  onViewModeChange 
}) => {
  return (
    <div style={styles.header}>
      <h1 style={styles.title}>
        <Calendar size={24} style={{ marginRight: '10px' }} />
        Programador Home Office
      </h1>

      <div style={styles.controls}>
        <select
          value={currentMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          style={styles.select}
        >
          {MONTH_NAMES.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>
        
        <input
          type="number"
          value={currentYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          style={styles.inputYear}
          min="2020"
        />

        <button 
          onClick={() => onViewModeChange('week')} 
          style={viewMode === 'week' ? styles.btnActive : styles.btn}
        >
          Semana
        </button>
        
        <button 
          onClick={() => onViewModeChange('month')} 
          style={viewMode === 'month' ? styles.btnActive : styles.btn}
        >
          Mes
        </button>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd',
    paddingBottom: '10px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    color: '#333',
    fontSize: '24px',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '10px',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  inputYear: {
    width: '70px',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  btn: {
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#eee',
    cursor: 'pointer',
  },
  btnActive: {
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
  },
};

export default Header;