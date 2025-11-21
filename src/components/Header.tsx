import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/fequeijaologo.png';
import menuIcon from '../icons/menu-svgrepo-com.svg';
import closeIcon from '../icons/close-svgrepo-com.svg';
import searchIcon from '../icons/search-alt-2-svgrepo-com.svg';
import basketIcon from '../icons/basket-svgrepo-com.svg';
import { useSearch } from '../contexts/SearchContext';
import AboutModal from './AboutModal';
import ContactModal from './ContactModal';
import './Header.css';

const Header: React.FC = () => {
  const { setSearchTerm, isSearchOpen, setIsSearchOpen } = useSearch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOverlayExiting, setIsOverlayExiting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAboutExiting, setIsAboutExiting] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isContactExiting, setIsContactExiting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  // Controlar overlay quando menu abre/fecha
  useEffect(() => {
    if (isMenuOpen) {
      setShowOverlay(true);
      setIsOverlayExiting(false);
    } else if (showOverlay) {
      setIsOverlayExiting(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
        setIsOverlayExiting(false);
      }, 300); // Duração da animação de saída
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, showOverlay]);

  // Focar o input quando a pesquisa abrir
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isSearchOpen]);

  const handleCartClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleMenuClose();
    // Fechar pesquisa se estiver aberta
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
    // Salvar posição de scroll da Home antes de navegar para o Cart
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
    sessionStorage.setItem('navigationActive', 'true');
    navigate('/cart');
  };

  const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleMenuClose();
    // Fechar pesquisa se estiver aberta
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
    setIsAboutOpen(true);
    setIsAboutExiting(false);
    // Prevenir scroll do body quando modal estiver aberto
    document.body.style.overflow = 'hidden';
  };

  const handleAboutClose = () => {
    setIsAboutExiting(true);
    // Restaurar scroll do body
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsAboutOpen(false);
      setIsAboutExiting(false);
    }, 300); // Duração da animação de saída
  };

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleMenuClose();
    // Fechar pesquisa se estiver aberta
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
    setIsContactOpen(true);
    setIsContactExiting(false);
    // Prevenir scroll do body quando modal estiver aberto
    document.body.style.overflow = 'hidden';
  };

  const handleContactClose = () => {
    setIsContactExiting(true);
    // Restaurar scroll do body
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsContactOpen(false);
      setIsContactExiting(false);
    }, 300); // Duração da animação de saída
  };

  return (
    <header className="header">
      <div className="header-container">
        <button
          id="menu-toggle"
          className={`menu-btn ${isMenuOpen ? 'close' : ''} ${isSearchOpen ? 'hidden' : ''}`}
          aria-label="Menu"
          onClick={handleMenuToggle}
        >
          {isMenuOpen ? (
            <img src={closeIcon} alt="Fechar" className="icon" />
          ) : (
            <img src={menuIcon} alt="Menu" className="icon" />
          )}
        </button>
        
        <ul id="menu" className={`menu ${isMenuOpen ? 'open' : ''}`}>
          <li>
            <a href="#about" onClick={handleAboutClick}>Quem Somos</a>
          </li>
          <li>
            <a href="#contact" onClick={handleContactClick}>Contato</a>
          </li>
          <li className="cart-menu-item">
            <a href="#cart" onClick={handleCartClick} className="cart-link">
              <img src={basketIcon} alt="Carrinho" className="menu-icon" />
              <span>Carrinho</span>
            </a>
          </li>
        </ul>
        
        {showOverlay && (
          <div className={`menu-overlay ${isOverlayExiting ? 'exiting' : ''}`} onClick={handleMenuClose}></div>
        )}
        
        <div className={`logo-container ${isSearchOpen ? 'hidden' : ''}`}>
          <img src={logoImage} alt="FÉQUEIJÃO Logo" className="logo-image" />
        </div>
        
        <div className={`search-container ${isSearchOpen ? 'expanded' : ''}`}>
          <input
            ref={searchInputRef}
            type="text"
            id="search-input"
            className={`search-input ${isSearchOpen ? 'square' : ''}`}
            placeholder="Buscar produtos..."
            onChange={handleSearchChange}
          />
        </div>
        
        <button
          id="search-btn"
          className={`search-btn ${isSearchOpen ? 'close' : ''}`}
          aria-label="Buscar"
          onClick={handleSearchClick}
        >
          {isSearchOpen ? (
            <svg className="icon close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <img src={searchIcon} alt="Buscar" className="icon" />
          )}
        </button>
      </div>
      <AboutModal isOpen={isAboutOpen} isExiting={isAboutExiting} onClose={handleAboutClose} />
      <ContactModal isOpen={isContactOpen} isExiting={isContactExiting} onClose={handleContactClose} />
    </header>
  );
};

export default Header;