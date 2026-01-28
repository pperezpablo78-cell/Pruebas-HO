// frontend/src/components/ScheduleCell.jsx
import React from 'react';
import { getReasonColor, getHomeOfficeColor, isHomeOfficeReason } from '../utils/scheduleUtils';
 
const ScheduleCell = ({ 
  status, 
  reasonName, 
  officePlaceNumber, 
  onClick,
  isMonthView = false
}) => {
  let cellContent;
  let cellColor = getReasonColor(reasonName);
 
  if (status === 'office' || reasonName === 'En sitio') {
    cellContent = isMonthView ? null : '';
    cellColor = cellColor || '#FFFFFF';
  } else if (isHomeOfficeReason(reasonName) || status === 'home') {
    // Mostrar número si existe, sino mostrar "HO"
    cellContent = officePlaceNumber || (isMonthView ? 'HO' : 'Home');
    cellColor = cellColor || getHomeOfficeColor();
  } else if (status === 'holiday') {
    cellContent = isMonthView ? '🎉' : (reasonName ? reasonName.substring(0, 15) + '...' : '🎉');
    cellColor = cellColor || '#fef3c7';
  } else if (reasonName) {
    cellContent = isMonthView 
      ? reasonName.substring(0, 4) 
      : reasonName.substring(0, 15) + '...';
    cellColor = cellColor;
  } else {
    cellContent = '-';
    cellColor = '#fff7ed';
  }
 
  const isPlaceNumber = (status === 'home' || isHomeOfficeReason(reasonName)) && officePlaceNumber;
 
  return (
    <td 
      style={{
        ...styles.cell,
        ...(isMonthView ? styles.cellMonth : styles.cellWeek),
        backgroundColor: cellColor,
        cursor: 'pointer'
      }}
      onClick={onClick}
      title={reasonName || 'Click para asignar causa'}
    >
      <div style={{
        fontSize: isPlaceNumber ? (isMonthView ? '12px' : '14px') : (isMonthView ? '8px' : '10px'),
        fontWeight: isPlaceNumber ? 'bold' : 'normal'
      }}>
        {cellContent}
      </div>
    </td>
  );
};
 
const styles = {
  cell: {
    border: '1px solid #eee',
    padding: '8px',
    textAlign: 'center',
    transition: 'background-color 0.2s',
  },
  cellWeek: {
    fontSize: '14px',
  },
  cellMonth: {
    fontSize: '12px',
    width: '30px',
    minWidth: '30px',
    height: '35px',
    lineHeight: '1.2',
    padding: '5px',
  }
};
 
export default ScheduleCell;
 