// frontend/src/components/WeekView.jsx
import React from 'react';
import { Users, Edit2, Trash2, AlertCircle, Calendar } from 'lucide-react';
import ScheduleCell from './ScheduleCell';
import { DAYS } from '../utils/constants';
import { countHomeDays } from '../utils/scheduleUtils';

const WeekView = ({ 
  employees,
  schedule,
  dayReasons,
  holidays,
  vacations = {}, // Default vacío
  currentWeek,
  errors,
  onCellClick,
  onEditEmployee,
  onDeleteEmployee,
  onManageVacations
}) => {
  const getReasonName = (empId, week, day) => {
    const reasonKey = `${empId}-${week}-${day}`;
    return dayReasons[reasonKey] || null;
  };

  const isHoliday = (week, day) => {
    return holidays[week] && holidays[week][day];
  };

  const isVacation = (empId, week, day) => {
    return vacations[empId]?.[week]?.[day];
  };

  return (
    <div style={styles.scheduleContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Empleado</th>
            <th style={styles.th}>Modalidad</th>
            {DAYS.map(day => (
              <th key={day} style={styles.th}>
                {day}
                {isHoliday(currentWeek, day) && (
                  <div style={styles.holidayBadge}>
                    🎉 {holidays[currentWeek][day].description}
                  </div>
                )}
              </th>
            ))}
            <th style={styles.th}>Total Home</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <React.Fragment key={emp.id}>
              <tr style={styles.tr}>
                <td style={styles.tdName}>
                  <Users size={16} />
                  <div>
                    <div>{emp.name}</div>
                    <div style={styles.employeeCode}>{emp.employeeCode}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={
                    emp.modalidad === 'Full Remoto' 
                      ? styles.badgeRemote 
                      : emp.modalidad === 'Turno Rotativo' 
                        ? styles.badgeRotativo 
                        : styles.badgeHibrido
                  }>
                    {emp.modalidad}
                  </span>
                </td>
                {DAYS.map(day => {
                  const status = schedule[emp.id]?.[currentWeek]?.[day];
                  const reasonName = getReasonName(emp.id, currentWeek, day);
                  
                  return (
                    <ScheduleCell
                      key={day}
                      status={status}
                      reasonName={reasonName}
                      officePlaceNumber={emp.officePlaceNumber}
                      onClick={() => onCellClick(emp.id, currentWeek, day)}
                      isMonthView={false}
                    />
                  );
                })}
                <td style={styles.tdTotal}>
                  {emp.modalidad === 'Full Remoto' 
                    ? '5 días' 
                    : `${countHomeDays(schedule, emp.id, currentWeek)} días`}
                </td>
                <td style={styles.tdActions}>
                  <button 
                    onClick={() => onManageVacations(emp)}
                    style={styles.btnVacation}
                    title="Gestionar vacaciones"
                  >
                    <Calendar size={16} />
                  </button>
                  <button 
                    onClick={() => onEditEmployee(emp)}
                    style={styles.btnEdit}
                    title="Editar empleado"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteEmployee(emp.id)}
                    style={styles.btnDelete}
                    title="Eliminar empleado"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              {errors[emp.id] && (
                <tr>
                  <td colSpan={DAYS.length + 4} style={styles.errorRow}>
                    <AlertCircle size={16} />
                    {errors[emp.id]}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  scheduleContainer: {
    overflowX: 'auto',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    minWidth: '1000px',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  th: {
    border: '1px solid #ddd',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    position: 'relative',
    minWidth: '50px',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  td: {
    border: '1px solid #eee',
    padding: '8px',
    textAlign: 'center',
    fontSize: '14px',
  },
  tdName: {
    border: '1px solid #eee',
    padding: '8px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '200px',
  },
  employeeCode: {
    fontSize: '10px',
    fontWeight: 'normal',
    color: '#666',
  },
  tdTotal: {
    border: '1px solid #eee',
    padding: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#e5e7eb',
  },
  tdActions: {
    border: '1px solid #eee',
    padding: '5px',
    textAlign: 'center',
    minWidth: '140px',
  },
  badgeRemote: {
    backgroundColor: '#34d399',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  badgeHibrido: {
    backgroundColor: '#60a5fa',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  badgeRotativo: {
    backgroundColor: '#facc15',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  holidayBadge: {
    fontSize: '9px',
    fontWeight: 'normal',
    color: '#b45309',
    marginTop: '5px',
  },
  btnVacation: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  btnEdit: {
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  btnDelete: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  errorRow: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    textAlign: 'center',
    padding: '10px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
  },
};

export default WeekView;