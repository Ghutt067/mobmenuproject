import React from 'react';
import closeIcon from '../icons/close-svgrepo-com.svg';
import { useStore } from '../contexts/StoreContext';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  isExiting?: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, isExiting = false, onClose }) => {
  const { store } = useStore();
  
  if (!isOpen && !isExiting) return null;

  return (
    <>
      <div className={`contact-overlay ${isExiting ? 'exiting' : ''}`} onClick={onClose}></div>
      <div className={`contact-modal ${isExiting ? 'exiting' : ''}`}>
        <button className="contact-close-btn" onClick={onClose} aria-label="Fechar">
          <img src={closeIcon} alt="Fechar" className="icon" />
        </button>
        <div className="contact-content">
          <h1>Contato</h1>
          <div className="contact-info">
            {store?.ownerEmail && (
              <div className="contact-item">
                <div className="contact-item-header">
                  <svg className="contact-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="currentColor"/>
                  </svg>
                  <span className="contact-label">Email:</span>
                </div>
                <a href={`mailto:${store.ownerEmail}`} className="contact-link">
                  {store.ownerEmail}
                </a>
              </div>
            )}
            {!store?.ownerEmail && (
              <div className="contact-item">
                <p style={{ color: 'var(--store-text-color, #666)', margin: 0 }}>
                  Informações de contato não disponíveis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactModal;
