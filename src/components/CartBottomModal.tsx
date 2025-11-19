import React from 'react';
import { useNavigate } from 'react-router-dom';
import basketIcon from '../icons/basket-svgrepo-com.svg';
import { useSearch } from '../contexts/SearchContext';
import './CartBottomModal.css';

interface CartBottomModalProps {
  isExiting?: boolean;
}

const CartBottomModal: React.FC<CartBottomModalProps> = ({ isExiting = false }) => {
  const navigate = useNavigate();
  const { isSearchOpen, setIsSearchOpen, setSearchTerm } = useSearch();

  const handleCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Fechar pesquisa se estiver aberta
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
    // Salvar posição de scroll da Home antes de navegar para o Cart
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    if (scrollPosition > 0) {
      sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
    }
    navigate('/cart');
  };

  return (
    <div className={`cart-bottom-modal ${isExiting ? 'exiting' : ''}`}>
      <button className="cart-bottom-button" onClick={handleCartClick}>
        <div className="cart-bottom-content">
          <span>Ver carrinho</span>
          <img src={basketIcon} alt="Carrinho" className="cart-bottom-icon" />
        </div>
      </button>
    </div>
  );
};

export default CartBottomModal;

