import React from 'react';
import closeIcon from '../icons/close-svgrepo-com.svg';
import phoneIcon from '../icons/phone.svg';
import gmailIcon from '../icons/gmail.svg';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  isExiting?: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, isExiting = false, onClose }) => {
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
            <div className="contact-item">
              <div className="contact-item-header">
                <img src={phoneIcon} alt="WhatsApp" className="contact-icon" />
                <span className="contact-label">Whatsapp:</span>
              </div>
              <a href="https://wa.me/554866612431" target="_blank" rel="noopener noreferrer" className="contact-link">
                48 6661-2431
              </a>
            </div>
            <div className="contact-item">
              <div className="contact-item-header">
                <img src={gmailIcon} alt="Gmail" className="contact-icon" />
                <span className="contact-label">Gmail:</span>
              </div>
              <a href="mailto:fequeijao@gmail.com" className="contact-link">
                fequeijao@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactModal;
