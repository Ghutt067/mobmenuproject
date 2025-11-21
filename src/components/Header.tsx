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
  const [borderColor, setBorderColor] = useState<string>('#FFFFFF');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
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

  // Detectar cor da borda da imagem do logo e aplicar no header (desktop)
  useEffect(() => {
    if (window.innerWidth < 768) {
      return;
    }

    const detectBorderColor = () => {
      // Aguardar a imagem estar no DOM
      const logoImg = document.querySelector('.logo-image') as HTMLImageElement;
      if (!logoImg) {
        return;
      }

      const processImage = (imageSrc: string) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Amostrar pixels das bordas (topo, baixo, esquerda, direita)
            const sampleSize = Math.max(1, Math.floor(Math.min(img.width, img.height) * 0.05));
            const pixels: number[] = [];
            
            // Topo
            for (let x = 0; x < img.width; x += sampleSize) {
              const pixelData = ctx.getImageData(x, 0, 1, 1).data;
              pixels.push(pixelData[0], pixelData[1], pixelData[2]);
            }
            
            // Baixo
            for (let x = 0; x < img.width; x += sampleSize) {
              const pixelData = ctx.getImageData(x, img.height - 1, 1, 1).data;
              pixels.push(pixelData[0], pixelData[1], pixelData[2]);
            }
            
            // Esquerda
            for (let y = 0; y < img.height; y += sampleSize) {
              const pixelData = ctx.getImageData(0, y, 1, 1).data;
              pixels.push(pixelData[0], pixelData[1], pixelData[2]);
            }
            
            // Direita
            for (let y = 0; y < img.height; y += sampleSize) {
              const pixelData = ctx.getImageData(img.width - 1, y, 1, 1).data;
              pixels.push(pixelData[0], pixelData[1], pixelData[2]);
            }

            // Calcular média das cores
            let r = 0, g = 0, b = 0;
            const count = pixels.length / 3;
            if (count > 0) {
              for (let i = 0; i < pixels.length; i += 3) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
              }
              
              r = Math.round(r / count);
              g = Math.round(g / count);
              b = Math.round(b / count);
              
              const color = `rgb(${r}, ${g}, ${b})`;
              setBorderColor(color);
              
              // Aplicar cor no header apenas em desktop
              if (window.innerWidth >= 768 && headerRef.current) {
                headerRef.current.style.backgroundColor = color;
              }
            }
          } catch (error) {
            console.error('Erro ao detectar cor da borda:', error);
          }
        };
        
        img.onerror = () => {
          console.error('Erro ao carregar imagem do logo');
        };
        
        img.src = imageSrc;
      };

      // Se a imagem já está carregada, processar imediatamente
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        processImage(logoImg.src);
      } else {
        // Aguardar o carregamento da imagem
        logoImg.addEventListener('load', () => {
          processImage(logoImg.src);
        }, { once: true });
      }
    };

    // Aguardar um pouco para garantir que o DOM está pronto
    const timer = setTimeout(detectBorderColor, 300);
    
    // Re-detectar ao redimensionar
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        detectBorderColor();
      } else if (headerRef.current) {
        headerRef.current.style.backgroundColor = '#FFFFFF';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    <header className="header" ref={headerRef}>
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