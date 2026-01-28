// frontend/src/App.jsx
import React, { useState } from 'react';
import { useScheduler } from './hooks/useScheduler';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import AddEmployeeModal from './components/AddEmployeeModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import ReasonModal from './components/ReasonModal';
import HolidayModal from './components/HolidayModal';
import VacationModal from './components/VacationModal';
import { isHomeOfficeReason } from './utils/scheduleUtils';
import { MONTH_NAMES, CAUSAS } from './utils/constants';
import { getWorkDaysInMonth } from './utils/dateUtils';
 
function App() {
  const {
    employees,
    schedule,
    dayReasons,
    holidays,
    vacations,
    currentMonth,
    currentYear,
    currentWeek,
    loading,
    setCurrentMonth,
    setCurrentYear,
    setCurrentWeek,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateScheduleCell,
    addHoliday,
    deleteHoliday,
    addVacations,
    deleteEmployeeVacations,
    generateSchedule,
  } = useScheduler();
 
  const [viewMode, setViewMode] = useState('month');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [vacationEmployee, setVacationEmployee] = useState(null);
  const [errors, setErrors] = useState({});
 
  // Handlers
  const handleCellClick = (empId, week, day) => {
    const employee = employees.find(e => e.id === empId);
    setSelectedCell({ empId, week, day, employee });
    setShowReasonModal(true);
  };
 
  const handleApplyReason = async (reason) => {
    const { empId, week, day } = selectedCell;
    
    let status = 'office';
    if (isHomeOfficeReason(reason)) {
      status = 'home';
    } else if (reason.includes('Vacaciones') || reason.includes('Asueto') || 
               reason.includes('No labora') || reason.includes('Suspendido')) {
      status = 'holiday';
    }
 
    const result = await updateScheduleCell(empId, week, day, status, reason);
    
    if (!result.success) {
      setErrors({ ...errors, [empId]: result.error });
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[empId];
          return newErrors;
        });
      }, 3000);
    }
  };
 
  const handleAddEmployee = async (employeeData) => {
    const result = await addEmployee(employeeData);
    if (result.success) {
      setShowAddEmployee(false);
    } else {
      alert(result.error);
    }
  };
 
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditEmployee(true);
  };
 
  const handleSaveEditEmployee = async (id, employeeData) => {
    const result = await updateEmployee(id, employeeData);
    if (result.success) {
      setShowEditEmployee(false);
      setEditingEmployee(null);
    } else {
      alert(result.error);
    }
  };
 
  const handleDeleteEmployee = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      const result = await deleteEmployee(id);
      if (!result.success) {
        alert(result.error);
      }
    }
  };
 
  const handleAddHoliday = async (week, day, description) => {
    const result = await addHoliday(week, day, description);
    if (!result.success) {
      alert(result.error);
    }
  };
 
  const handleDeleteHoliday = async (holidayId) => {
    if (window.confirm('¿Eliminar este asueto?')) {
      const result = await deleteHoliday(holidayId);
      if (!result.success) {
        alert(result.error);
      }
    }
  };
 
  const handleGenerateSchedule = async () => {
    if (!window.confirm('¿Generar horario automático? Esto reemplazará el horario actual del mes.')) {
      return;
    }
 
    const result = await generateSchedule();
    if (result.success) {
      alert(result.message || 'Horario generado exitosamente');
    } else {
      alert(result.error || 'Error al generar horario');
    }
  };
 
  const handleAddVacations = async (employeeId, vacationDays) => {
    const result = await addVacations(employeeId, vacationDays);
    if (result.success) {
      alert('Vacaciones guardadas exitosamente');
      setShowVacationModal(false);
      setVacationEmployee(null);
    } else {
      alert(result.error);
    }
  };
 
  const handleDeleteVacations = async (employeeId) => {
    const result = await deleteEmployeeVacations(employeeId);
    if (result.success) {
      alert('Vacaciones eliminadas exitosamente');
    } else {
      alert(result.error);
    }
  };
 
  const handleExport = () => {
    const monthDays = getWorkDaysInMonth(currentYear, currentMonth);
 
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Horario ${MONTH_NAMES[currentMonth]} ${currentYear}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 3px 2px; text-align: center; height: 20px; }
    .header-row { background-color: #D3D3D3; font-weight: bold; font-size: 9px; }
    .employee-name { text-align: left; padding-left: 5px; min-width: 180px; font-size: 8px; }
    .col-labora { background-color: #D3D3D3; width: 50px; font-size: 8px; }
    .col-position { background-color: #D3D3D3; min-width: 150px; text-align: left; padding-left: 5px; font-size: 8px; }
    .col-code { background-color: #D3D3D3; width: 70px; font-size: 8px; }
    .day-num { background-color: #D3D3D3; font-weight: bold; font-size: 9px; width: 25px; }
    .month-name { background-color: #FFFF00; font-weight: bold; font-size: 9px; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr class="header-row">
        <th class="col-labora">Labora</th>
        <th class="col-position">Nombre de la posición</th>
        <th class="col-code">Cod. De Empleado</th>
        <th class="employee-name">Nombre</th>`;
    
    monthDays.forEach(d => {
      html += `<th class="day-num">${d.day}</th>`;
    });
    html += `</tr><tr class="header-row"><th colspan="4"></th>`;
    
    monthDays.forEach(() => {
      html += `<th class="month-name">${MONTH_NAMES[currentMonth]}</th>`;
    });
    html += `</tr></thead><tbody>`;
 
    employees.forEach(emp => {
      html += `<tr>
        <td class="col-labora">${emp.labora}</td>
        <td class="col-position">${emp.position || 'N/A'}</td>
        <td class="col-code">${emp.employeeCode || ''}</td>
        <td class="employee-name">${emp.name}</td>`;
      
      monthDays.forEach(d => {
        const status = schedule[emp.id]?.[d.week]?.[d.dayName];
        const reasonKey = `${emp.id}-${d.week}-${d.dayName}`;
        const reasonName = dayReasons[reasonKey];
        
        let cellValue = '';
        let backgroundColor = '#FFFFFF';
        let textColor = '#000000';
        
        // Determinar color según la causa
        if (reasonName) {
          const causa = CAUSAS.find(c => c.name === reasonName);
          backgroundColor = causa ? causa.color : '#FFFFFF';
          
          // Ajustar color de texto para fondos oscuros
          if (backgroundColor === '#FF00FF' || backgroundColor === '#FF6347') {
            textColor = '#FFFFFF';
          }
        }
        
        // Determinar contenido de la celda
        if (isHomeOfficeReason(reasonName) || status === 'home') {
          cellValue = emp.officePlaceNumber || 'HO';
        } else if (reasonName === 'Vacaciones') {
          cellValue = 'VAC';
        } else if (reasonName === 'Asueto / Feriado') {
          cellValue = 'ASUETO';
        } else if (reasonName === 'Servicio') {
          cellValue = 'SER';
        } else if (reasonName === 'Maternidad/Paternidad') {
          cellValue = 'M/P';
        } else if (reasonName === 'Lactancia') {
          cellValue = 'LACT';
        } else if (reasonName === 'Salud') {
          cellValue = 'SALUD';
        } else if (reasonName === 'Suspensión gas') {
          cellValue = 'S-GAS';
        } else if (reasonName === 'Suspendido EPSS') {
          cellValue = 'S-EPSS';
        } else if (reasonName === 'Canje horas') {
          cellValue = 'C-HRS';
        } else if (reasonName === 'NL - No labora') {
          cellValue = 'NL';
        } else if (reasonName === 'En sitio') {
          cellValue = '';
        } else if (status === 'office') {
          cellValue = '';
        } else {
          cellValue = '';
        }
        
        html += `<td style="background-color: ${backgroundColor}; color: ${textColor}; font-weight: bold;">${cellValue}</td>`;
      });
      
      html += `</tr>`;
    });
    html += `</tbody></table>
    
    <br><br>
    <h3>Leyenda de Colores:</h3>
    <table style="width: auto; margin-top: 10px;">
      <tr>
        <td style="background-color: #90EE90; padding: 5px; border: 1px solid #000;">Home Office</td>
        <td style="background-color: #FFFF00; padding: 5px; border: 1px solid #000;">Servicio / Asueto</td>
        <td style="background-color: #FFC0CB; padding: 5px; border: 1px solid #000;">Maternidad/Paternidad</td>
        <td style="background-color: #FF00FF; color: white; padding: 5px; border: 1px solid #000;">Lactancia</td>
      </tr>
      <tr>
        <td style="background-color: #87CEEB; padding: 5px; border: 1px solid #000;">Salud</td>
        <td style="background-color: #FFA500; padding: 5px; border: 1px solid #000;">Suspensión Gas</td>
        <td style="background-color: #FFD700; padding: 5px; border: 1px solid #000;">Vacaciones</td>
        <td style="background-color: #FFFFFF; padding: 5px; border: 1px solid #000;">En Sitio</td>
      </tr>
      <tr>
        <td style="background-color: #FF6347; color: white; padding: 5px; border: 1px solid #000;">Suspendido EPSS</td>
        <td style="background-color: #DDA0DD; padding: 5px; border: 1px solid #000;">Canje Horas</td>
        <td style="background-color: #D3D3D3; padding: 5px; border: 1px solid #000;">No Labora</td>
        <td style="background-color: #98FB98; padding: 5px; border: 1px solid #000;">HO - Enfermedad</td>
      </tr>
    </table>
    </body></html>`;
 
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Horario_${MONTH_NAMES[currentMonth]}_${currentYear}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
 
  const getCurrentReason = () => {
    if (!selectedCell) return '';
    const reasonKey = `${selectedCell.empId}-${selectedCell.week}-${selectedCell.day}`;
    return dayReasons[reasonKey] || '';
  };
 
  if (loading && employees.length === 0) {
    return <div style={styles.container}>Cargando...</div>;
  }
 
  return (
    <div style={styles.container}>
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        viewMode={viewMode}
        onMonthChange={(month) => {
          setCurrentMonth(month);
          setCurrentWeek(1);
        }}
        onYearChange={(year) => {
          setCurrentYear(year);
          setCurrentWeek(1);
        }}
        onViewModeChange={setViewMode}
      />
 
      <Toolbar
        viewMode={viewMode}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        onAddEmployee={() => setShowAddEmployee(true)}
        onAddHoliday={() => setShowHolidayModal(true)}
        onGenerateSchedule={handleGenerateSchedule}
        onExport={handleExport}
      />
 
      {viewMode === 'week' ? (
        <WeekView
          employees={employees}
          schedule={schedule}
          dayReasons={dayReasons}
          holidays={holidays}
          vacations={vacations}
          currentWeek={currentWeek}
          errors={errors}
          onCellClick={handleCellClick}
          onEditEmployee={handleEditEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onManageVacations={(emp) => {
            setVacationEmployee(emp);
            setShowVacationModal(true);
          }}
        />
      ) : (
        <MonthView
          employees={employees}
          schedule={schedule}
          dayReasons={dayReasons}
          holidays={holidays}
          vacations={vacations}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onCellClick={handleCellClick}
        />
      )}
 
      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSave={handleAddEmployee}
      />
 
      <EditEmployeeModal
        key={editingEmployee?.id || 'edit-modal'} 
        isOpen={showEditEmployee}
        onClose={() => {
          setShowEditEmployee(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSave={handleSaveEditEmployee}
      />
 
      <ReasonModal
        key={selectedCell ? `${selectedCell.empId}-${selectedCell.week}-${selectedCell.day}` : 'reason-modal'}
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setSelectedCell(null);
        }}
        selectedCell={selectedCell}
        currentReason={getCurrentReason()}
        onApply={handleApplyReason}
      />
 
      <HolidayModal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        currentMonth={currentMonth}
        currentYear={currentYear}
        holidays={holidays}
        onSave={handleAddHoliday}
        onDelete={handleDeleteHoliday}
      />
 
      <VacationModal
        key={vacationEmployee?.id || 'vacation-modal'}
        isOpen={showVacationModal}
        onClose={() => {
          setShowVacationModal(false);
          setVacationEmployee(null);
        }}
        employee={vacationEmployee}
        currentMonth={currentMonth}
        currentYear={currentYear}
        vacations={vacations}
        holidays={holidays}
        onSave={handleAddVacations}
        onDelete={handleDeleteVacations}
      />
    </div>
  );
}
 
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
  },
};
 
export default App;
 