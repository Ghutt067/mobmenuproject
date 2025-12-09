import React from 'react';
import closeIcon from '../icons/close-svgrepo-com.svg';
import { useStore } from '../contexts/StoreContext';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  isExiting?: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, isExiting = false, onClose }) => {
  const { store } = useStore();
  
  if (!isOpen && !isExiting) return null;

  return (
    <>
      <div className={`about-overlay ${isExiting ? 'exiting' : ''}`} onClick={onClose}></div>
      <div className={`about-modal ${isExiting ? 'exiting' : ''}`}>
        <button className="about-close-btn" onClick={onClose} aria-label="Fechar">
          <img src={closeIcon} alt="Fechar" className="icon" />
        </button>
        <div className="about-content">
          <h1>Quem Somos</h1>
          <div className="about-text">
            {store?.description ? (
              <p>{store.description}</p>
            ) : (
              <p>Informações sobre a loja em breve.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutModal;
