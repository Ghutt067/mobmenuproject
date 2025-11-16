import React, { useState } from 'react';
import logoImage from '../assets/fequeijaologo.png';
import menuIcon from '../icons/menu-svgrepo-com.svg';
import searchIcon from '../icons/search-alt-2-svgrepo-com.svg';
import './Header.css';

const Header: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <button className="menu-btn" aria-label="Menu">
          <img src={menuIcon} alt="Menu" className="icon" />
        </button>
        
        <div className={`logo-container ${isSearchOpen ? 'hidden' : ''}`}>
          <img src={logoImage} alt="FÉQUEIJÃO Logo" className="logo-image" />
        </div>
        
        <div className={`search-container ${isSearchOpen ? 'expanded' : ''}`}>
          <input
            type="text"
            id="search-input"
            className={`search-input ${isSearchOpen ? 'square' : ''}`}
            placeholder="Buscar produtos..."
            autoFocus={isSearchOpen}
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
    </header>
  );
};

export default Header;