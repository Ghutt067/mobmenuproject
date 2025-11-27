import React from 'react';
import { useStore } from '../contexts/StoreContext';
import './StoreDetailsModal.css';

interface StoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoreDetailsModal: React.FC<StoreDetailsModalProps> = ({ isOpen, onClose }) => {
  const { store } = useStore();

  if (!isOpen || !store) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="store-details-modal-overlay" onClick={handleOverlayClick}>
      <div className="store-details-modal-content">
        <button 
          className="store-details-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
        
        <h2 className="store-details-modal-title">{store.name}</h2>
        
        {store.description && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Sobre</h3>
            <p className="store-details-section-content">{store.description}</p>
          </div>
        )}

        {store.openingHours && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Horários</h3>
            <p className="store-details-section-content">{store.openingHours}</p>
          </div>
        )}

        {store.address && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Localização</h3>
            <p className="store-details-section-content">{store.address}</p>
          </div>
        )}

        {store.paymentMethods && store.paymentMethods.length > 0 && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Formas de Pagamento</h3>
            <ul className="store-details-payment-list">
              {store.paymentMethods.map((method, index) => (
                <li key={index} className="store-details-payment-item">
                  {method}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetailsModal;

