// frontend/src/components/EditEmployeeModal.jsx
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal';
import { MODALIDADES } from '../utils/constants';

const EditEmployeeModal = ({ isOpen, onClose, employee, onSave }) => {
  const [formData, setFormData] = useState(() => {
    if (employee) {
      return { ...employee };
    }
    return {
      name: '',
      employeeCode: '',
      position: '',
      labora: 'Si',
      maxHomeDays: 2,
      modalidad: MODALIDADES.HIBRIDO,
      officePlaceNumber: ''
    };
  });

  if (!employee) return null;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // ✅ Auto-ajustar maxHomeDays según modalidad
      if (field === 'modalidad') {
        if (value === MODALIDADES.FULL_REMOTO) {
          updated.maxHomeDays = 5;
        } else if (value === MODALIDADES.EN_SITIO) {
          updated.maxHomeDays = 0; // ⭐ En Sitio = 0 días HO
        } else if (value === MODALIDADES.TURNO_ROTATIVO) {
          updated.maxHomeDays = 0;
        } else if (value === MODALIDADES.HIBRIDO) {
          updated.maxHomeDays = Math.min(prev.maxHomeDays || 2, 4);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.name.trim() || !formData.employeeCode || !formData.employeeCode.trim()) {
      alert('Completa Nombre y Código de Empleado.');
      return;
    }

    onSave(formData.id, formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Empleado"
      footer={
        <button onClick={handleSubmit} style={styles.btnSave}>
          <Save size={16} /> Guardar cambios
        </button>
      }
    >
      <label style={styles.label}>Nombre</label>
      <input 
        type="text" 
        value={formData.name} 
        onChange={(e) => handleChange('name', e.target.value)} 
        style={styles.input} 
      />

      <label style={styles.label}>Código de Empleado</label>
      <input 
        type="text" 
        value={formData.employeeCode} 
        onChange={(e) => handleChange('employeeCode', e.target.value)} 
        style={styles.input} 
      />
      
      <label style={styles.label}>Posición</label>
      <input 
        type="text" 
        value={formData.position || ''} 
        onChange={(e) => handleChange('position', e.target.value)} 
        style={styles.input} 
      />

      <label style={styles.label}>Número de Lugar en Oficina (Opcional)</label>
      <input 
        type="number" 
        value={formData.officePlaceNumber} 
        onChange={(e) => handleChange('officePlaceNumber', parseInt(e.target.value))} 
        style={styles.input} 
        min="1"
        placeholder="Dejar vacío si no aplica"
      />

      <label style={styles.label}>Labora (Sí/No)</label>
      <select 
        value={formData.labora} 
        onChange={(e) => handleChange('labora', e.target.value)} 
        style={styles.select}
      >
        <option value="Si">Si</option>
        <option value="No">No</option>
      </select>

      <label style={styles.label}>Modalidad</label>
      <select 
        value={formData.modalidad} 
        onChange={(e) => handleChange('modalidad', e.target.value)} 
        style={styles.select}
      >
        <option value={MODALIDADES.HIBRIDO}>Híbrido (2-3 días HO por semana)</option>
        <option value={MODALIDADES.FULL_REMOTO}>Full Remoto (5 días HO)</option>
        <option value={MODALIDADES.TURNO_ROTATIVO}>Turno Rotativo (alternado por semana)</option>
        <option value={MODALIDADES.EN_SITIO}>En Sitio (100% Presencial)</option>
      </select>

      {/* ⭐ Mostrar días HO solo si NO es "En Sitio" */}
      {formData.modalidad !== MODALIDADES.EN_SITIO && (
        <>
          <label style={styles.label}>
            Días máximos de Home Office por semana
          </label>
          <input 
            type="number" 
            value={formData.maxHomeDays} 
            onChange={(e) => handleChange('maxHomeDays', parseInt(e.target.value) || 0)} 
            style={styles.input}
            min="0"
            max={formData.modalidad === MODALIDADES.FULL_REMOTO ? 5 : 4}
            disabled={formData.modalidad === MODALIDADES.FULL_REMOTO}
          />
        </>
      )}

      {formData.modalidad === MODALIDADES.EN_SITIO && (
        <div style={styles.infoBox}>
          ℹ️ Este empleado estará siempre marcado como "En Oficina"
        </div>
      )}
    </Modal>
  );
};

const styles = {
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginTop: '10px',
    marginBottom: '5px',
    fontSize: '14px',
  },
  input: {
    width: 'calc(100% - 18px)',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  infoBox: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e0f2fe',
    border: '1px solid #0ea5e9',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#0c4a6e',
  },
  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
  },
};

export default EditEmployeeModal;