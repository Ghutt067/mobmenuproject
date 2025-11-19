import React, { useEffect, useState } from 'react';
import './AddToCartPopup.css';

interface AddToCartPopupProps {
  isOpen: boolean;
  onContinue: () => void;
  onAdd: () => void;
  onClose: () => void;
}

const AddToCartPopup: React.FC<AddToCartPopupProps> = ({
  isOpen,
  onContinue,
  onAdd,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Calcula a largura da barra de scroll antes de bloqueá-la
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Salva os valores atuais
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Encontra o elemento fixed-header e salva/adjusta seu padding
      const fixedHeader = document.querySelector('.fixed-header') as HTMLElement;
      const originalHeaderPaddingRight = fixedHeader ? fixedHeader.style.paddingRight : '';
      
      // Bloqueia o scroll e adiciona padding para compensar a barra de scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Ajusta o header fixo também
      if (fixedHeader) {
        fixedHeader.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup: restaura os valores quando o componente desmonta ou o popup fecha
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        if (fixedHeader) {
          fixedHeader.style.paddingRight = originalHeaderPaddingRight;
        }
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Duração da animação
  };

  const handleContinue = () => {
    setIsClosing(true);
    setTimeout(() => {
      onContinue();
      setIsClosing(false);
    }, 300);
  };

  const handleAdd = () => {
    setIsClosing(true);
    setTimeout(() => {
      onAdd();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`popup-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`popup-content ${isClosing ? 'closing' : ''}`}>
        <button className="popup-close-btn" onClick={handleClose} aria-label="Fechar">
          <svg className="popup-close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
          </svg>
        </button>
        <p className="popup-question">Gostaria de adicionar algo?</p>
        <div className="popup-buttons">
          <button className="popup-btn popup-btn-continue" onClick={handleContinue}>
            Continuar Compra
          </button>
          <button className="popup-btn popup-btn-add" onClick={handleAdd}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCartPopup;

