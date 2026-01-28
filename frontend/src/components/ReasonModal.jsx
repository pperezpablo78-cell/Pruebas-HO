// frontend/src/components/ReasonModal.jsx
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import { CAUSAS } from '../utils/constants';

const ReasonModal = ({ isOpen, onClose, selectedCell, currentReason, onApply }) => {
  const [selectedReason, setSelectedReason] = useState('');

  // Solo actualizar cuando el modal se abre
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason(currentReason || '');
    }
  }, [isOpen]); // SOLO cuando cambia isOpen

  if (!selectedCell) return null;

  const handleApply = () => {
    if (!selectedReason) {
      alert('Por favor selecciona una causa');
      return;
    }
    onApply(selectedReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar Causa para ${selectedCell.employee?.name}`}
      footer={
        <button onClick={handleApply} style={styles.btnSave}>
          <Check size={16} /> Aplicar Causa
        </button>
      }
    >
      <p>Día: {selectedCell.day}, Semana {selectedCell.week}</p>
      
      <label style={styles.label}>Causa</label>
      <select 
        value={selectedReason} 
        onChange={(e) => setSelectedReason(e.target.value)} 
        style={styles.select}
      >
        <option value="">-- Selecciona una causa --</option>
        {CAUSAS.map(causa => (
          <option 
            key={causa.name} 
            value={causa.name}
          >
            {causa.name}
          </option>
        ))}
      </select>

      {selectedReason && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: CAUSAS.find(c => c.name === selectedReason)?.color || '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Vista previa: {selectedReason}
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
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
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

export default ReasonModal;