import React from 'react';
import basketIcon from '../icons/basket-svgrepo-com.svg';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import './CartBottomModal.css';

interface CartBottomModalProps {
  isExiting?: boolean;
}

const CartBottomModal: React.FC<CartBottomModalProps> = ({ isExiting = false }) => {
  const { navigate } = useStoreNavigation();
  const { isSearchOpen, setIsSearchOpen, setSearchTerm } = useSearch();
  const { cartItems } = useCart();

  // Calcular total de itens no carrinho
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Fechar pesquisa se estiver aberta
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
    // Salvar posição de scroll da Home ANTES de navegar
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    // Sempre salvar a posição
    sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
    // Garantir que a flag de navegação ativa esteja setada
    sessionStorage.setItem('navigationActive', 'true');
    navigate('/sacola');
  };

  return (
    <div className={`cart-bottom-modal ${isExiting ? 'exiting' : ''}`}>
      <button className="cart-bottom-button" onClick={handleCartClick} aria-label="Ver carrinho">
        <div className="cart-bottom-content">
          <img src={basketIcon} alt="Carrinho" className="cart-bottom-icon" />
          {totalItems > 0 && (
            <span className="cart-bottom-badge">{totalItems}</span>
          )}
        </div>
      </button>
    </div>
  );
};

export default CartBottomModal;

