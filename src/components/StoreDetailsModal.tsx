import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { getDayNameInPortuguese } from '../utils/timezoneHelper';
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

  // Obter localização formatada
  const getLocation = () => {
    if (store.city && store.state) {
      return `${store.city} - ${store.state}`;
    }
    if (store.city) {
      return store.city;
    }
    if (store.address) {
      return store.address; // Fallback para o campo antigo
    }
    return null;
  };

  const location = getLocation();

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

        {location && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Localização</h3>
            <p className="store-details-section-content">{location}</p>
          </div>
        )}

        {store.operatingDays && store.operatingDays.length > 0 && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Horários de Funcionamento</h3>
            <div className="store-details-section-content">
              {store.operatingDays.map((day) => (
                <p key={day.day} style={{ margin: '4px 0' }}>
                  <strong>{getDayNameInPortuguese(day.day)}:</strong>{' '}
                  {day.open 
                    ? `${day.openTime || '08:00'} - ${day.closeTime || '18:00'}`
                    : 'Fechado'}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Fallback para horários antigos */}
        {(!store.operatingDays || store.operatingDays.length === 0) && store.openingHours && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Horários</h3>
            <p className="store-details-section-content">{store.openingHours}</p>
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

        {/* Status da Loja */}
        {(store.isClosed || store.appointmentOnlyMode) && (
          <div className="store-details-section">
            <h3 className="store-details-section-title">Status</h3>
            <p className="store-details-section-content">
              {store.isClosed && '🔴 Loja Fechada'}
              {store.appointmentOnlyMode && !store.isClosed && '🟡 Somente Agendamento'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetailsModal;
