import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import StoreDetailsModal from './StoreDetailsModal';
import { getCurrentTimeInTimezone, getDayNameInPortuguese, getDayNameFromNumber, isStoreOpen } from '../utils/timezoneHelper';
import './StoreInfo.css';

const StoreInfo: React.FC = () => {
  const { store } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTimeInfo, setCurrentTimeInfo] = useState<{ timeString: string; dayOfWeek: string; dayOfWeekNumber: number } | null>(null);
  const [storeStatus, setStoreStatus] = useState<'open' | 'closed' | 'appointment-only'>('open');

  // Atualizar horário atual periodicamente
  // IMPORTANTE: hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!store || !store.timezone) return;

    const updateTime = () => {
      const timeInfo = getCurrentTimeInTimezone(store.timezone || 'America/Sao_Paulo');
      setCurrentTimeInfo(timeInfo);
      
      // Verificar status da loja
      if (store.isClosed) {
        setStoreStatus('closed');
      } else if (store.appointmentOnlyMode) {
        setStoreStatus('appointment-only');
      } else {
        const isOpen = isStoreOpen(
          store.operatingDays,
          timeInfo.dayOfWeekNumber,
          timeInfo.timeString,
          store.isClosed || false,
          store.appointmentOnlyMode || false
        );
        setStoreStatus(isOpen ? 'open' : 'closed');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [store?.timezone, store?.operatingDays, store?.isClosed, store?.appointmentOnlyMode]);

  // Calcular posição acima do PromoBanner
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

  // Retornar null APÓS todos os hooks serem chamados
  if (!store) return null;

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

  // Obter horários do dia atual
  const getTodayTimes = () => {
    if (!store.operatingDays || !currentTimeInfo) return { openTime: null, closeTime: null };

    const currentDayName = getDayNameFromNumber(currentTimeInfo.dayOfWeekNumber);
    const todayConfig = store.operatingDays.find(d => d.day === currentDayName);

    if (todayConfig && todayConfig.open) {
      return {
        openTime: todayConfig.openTime || null,
        closeTime: todayConfig.closeTime || null,
      };
    }

    return { openTime: null, closeTime: null };
  };

  const location = getLocation();
  const todayTimes = getTodayTimes();
  const hasInfo = location || todayTimes.openTime || todayTimes.closeTime || currentTimeInfo;

  // Se não houver informações, não renderizar o componente
  if (!hasInfo) return null;

  // Formatar horário para exibição (ex: 22:00 -> 22h00)
  const formatTimeForDisplay = (time: string) => {
    if (!time) return null;
    return time.replace(':', 'h');
  };

  const formattedOpenTime = todayTimes.openTime ? formatTimeForDisplay(todayTimes.openTime) : null;
  const formattedClosingTime = todayTimes.closeTime ? formatTimeForDisplay(todayTimes.closeTime) : null;

  // Obter texto do status
  const getStatusText = () => {
    if (store.isClosed) {
      return 'Loja Fechada';
    }
    if (store.appointmentOnlyMode) {
      return 'Somente Agendamento';
    }
    if (storeStatus === 'closed' && formattedOpenTime) {
      return `Abre às ${formattedOpenTime}`;
    }
    if (storeStatus === 'open' && formattedClosingTime) {
      return `Aberto até às ${formattedClosingTime}`;
    }
    if (formattedClosingTime) {
      return `Aberto até às ${formattedClosingTime}`;
    }
    return 'Aberto';
  };

  return (
    <>
      <div className="store-info-container">
        <div className="store-info-card">
          {/* Localização */}
          {location && (
            <div className="store-info-item">
              <svg 
                className="store-info-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                  fill="currentColor"
                />
              </svg>
              <span className="store-info-value">{location}</span>
            </div>
          )}

          {/* Horário e Status */}
          {(formattedClosingTime || currentTimeInfo || storeStatus !== 'open') && (
            <div className="store-info-item">
              <svg 
                className="store-info-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" 
                  fill="currentColor"
                />
              </svg>
              <span className={`store-info-value store-info-time-value ${storeStatus === 'closed' ? 'store-closed' : storeStatus === 'appointment-only' ? 'store-appointment' : ''}`}>
                {getStatusText()}
              </span>
            </div>
          )}

          {/* Botão Mais Informações */}
          {(store.operatingDays || store.description || (store.paymentMethods && store.paymentMethods.length > 0)) && (
            <button 
              className="store-info-more-button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Ver mais informações sobre a loja"
            >
              <span>Ver mais informações</span>
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
