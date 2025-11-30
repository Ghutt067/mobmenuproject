import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import StoreDetailsModal from './StoreDetailsModal';
import './StoreInfo.css';

const StoreInfo: React.FC = () => {
  const { store } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calcular posição acima do PromoBanner - DEVE estar antes de qualquer return condicional
  useEffect(() => {
    if (!store) return;
    
    const updatePosition = () => {
      const container = document.querySelector('.store-info-container') as HTMLElement;
      const fixedHeader = document.querySelector('.fixed-header') as HTMLElement;
      const promoBanner = document.querySelector('.promo-banner') as HTMLElement;
      
      if (container && fixedHeader) {
        const headerHeight = fixedHeader.offsetHeight;
        const promoBannerHeight = promoBanner ? promoBanner.offsetHeight : 0;
        // Posicionar logo acima do PromoBanner (header + promo banner - altura do card)
        const topPosition = headerHeight - promoBannerHeight - (container.offsetHeight || 60) - 8;
        container.style.top = `${Math.max(0, topPosition)}px`;
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    // Aguardar um pouco para garantir que os elementos estejam renderizados
    setTimeout(updatePosition, 100);
    setTimeout(updatePosition, 300);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [store]);

  if (!store) return null;

  // Calcular horário de fechamento se disponível
  const getClosingTime = () => {
    // Priorizar closingTime se disponível
    if (store.closingTime) {
      // Se já está no formato correto (ex: "22:00"), retornar direto
      if (store.closingTime.match(/^\d{2}:\d{2}$/)) {
        return store.closingTime;
      }
      // Se está em outro formato, tentar extrair
      const timeMatch = store.closingTime.match(/(\d{2}:\d{2})/);
      if (timeMatch) {
        return timeMatch[1];
      }
      return store.closingTime;
    }
    if (store.openingHours) {
      // Tentar extrair horário de fechamento do formato de horários
      // Ex: "08:00 - 22:00" ou "Seg-Sex: 08:00 às 22:00"
      const hoursMatch = store.openingHours.match(/(\d{2}:\d{2})/g);
      if (hoursMatch && hoursMatch.length > 1) {
        return hoursMatch[hoursMatch.length - 1]; // Último horário encontrado
      }
      // Se só tem um horário, pode ser o de fechamento
      if (hoursMatch && hoursMatch.length === 1) {
        return hoursMatch[0];
      }
    }
    return null;
  };

  const closingTime = getClosingTime();
  const hasInfo = closingTime || store.address;

  // Se não houver informações, não renderizar o componente
  // (mas isso pode ser configurado para sempre mostrar se necessário)
  if (!hasInfo) return null;

  // Formatar horário de fechamento
  const formatClosingTime = (time: string) => {
    if (!time) return null;
    // Se já está no formato HH:MM, retornar
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    // Tentar extrair horário
    const timeMatch = time.match(/(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : time;
  };

  const formattedClosingTime = closingTime ? formatClosingTime(closingTime) : null;

  return (
    <>
      <div className="store-info-container">
        <div className="store-info-card">
          {/* Localização */}
          {store.address && (
            <div className="store-info-item">
              <div className="store-info-icon-wrapper store-info-icon-location">
                <svg 
                  className="store-info-icon" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="store-info-content">
                <span className="store-info-label">Localização:</span>
                <span className="store-info-value">{store.address}</span>
              </div>
            </div>
          )}

          {/* Horário */}
          {formattedClosingTime && (
            <div className="store-info-item">
              <div className="store-info-icon-wrapper store-info-icon-time">
                <svg 
                  className="store-info-icon" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="store-info-content">
                <span className="store-info-label">Horário:</span>
                <span className="store-info-value store-info-time-value">
                  Até {formattedClosingTime}
                </span>
              </div>
            </div>
          )}

          {/* Botão Mais Informações */}
          {(store.openingHours || store.description || (store.paymentMethods && store.paymentMethods.length > 0)) && (
            <div className="store-info-item">
              <button 
                className="store-info-more-button"
                onClick={() => setIsModalOpen(true)}
                aria-label="Ver mais informações sobre a loja"
              >
                <span>Mais informações</span>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <StoreDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default StoreInfo;

