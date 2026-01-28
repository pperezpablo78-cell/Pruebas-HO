// frontend/src/components/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} style={styles.btnClose}>
            <X size={20} />
          </button>
        </div>
        
        <div style={styles.modalBody}>
          {children}
        </div>
        
        {footer && (
          <div style={styles.modalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  btnClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
  },
  modalBody: {
    overflowY: 'auto',
    paddingRight: '10px',
    flexGrow: 1,
  },
  modalFooter: {
    borderTop: '1px solid #eee',
    paddingTop: '15px',
    marginTop: '15px',
    textAlign: 'right',
  },
};

export default Modal;