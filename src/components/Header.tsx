import React, { useState, useEffect, useRef } from 'react';
import logoImage from '../assets/fequeijaologo.png';
import menuIcon from '../icons/menu-svgrepo-com.svg';
import closeIcon from '../icons/close-svgrepo-com.svg';
import searchIcon from '../icons/search-alt-2-svgrepo-com.svg';
import basketIcon from '../icons/basket-svgrepo-com.svg';
import { useSearch } from '../contexts/SearchContext';
import { useStore } from '../contexts/StoreContext';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import AboutModal from './AboutModal';
import ContactModal from './ContactModal';
import './Header.css';

const Header: React.FC = () => {
  const { setSearchTerm, isSearchOpen, setIsSearchOpen } = useSearch();
  const { store } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOverlayExiting, setIsOverlayExiting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAboutExiting, setIsAboutExiting] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isContactExiting, setIsContactExiting] = useState(false);
  const [, setBorderColor] = useState<string>('#FFFFFF');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { navigate } = useStoreNavigation();
  
  // Usar logo customizado se existir, senão usar o padrão
  const currentLogoUrl = store?.customizations?.logoUrl || logoImage;
  const logoAlt = store?.customizations?.logoAltText || store?.name || 'Logo';

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
    navigate('/sacola');
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
          style={{ color: 'var(--store-text-color, #000000)' }}
        >
          {isMenuOpen ? (
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
            <a href="#cart" onClick={handleCartClick} className="cart-link" style={{ color: 'var(--store-text-color, #000000)' }}>
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21,9H19.535l-3.7-5.555a1,1,0,0,0-1.664,1.11L17.132,9H6.868L9.832,4.555a1,1,0,0,0-1.664-1.11L4.465,9H3a1,1,0,0,0,0,2H4v8a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V11h1a1,1,0,0,0,0-2ZM9,17.5a1,1,0,0,1-2,0v-4a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0v-4a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0v-4a1,1,0,0,1,2,0Z" fill="currentColor"/>
              </svg>
              <span>Carrinho</span>
            </a>
          </li>
        </ul>
        
        {showOverlay && (
          <div className={`menu-overlay ${isOverlayExiting ? 'exiting' : ''}`} onClick={handleMenuClose}></div>
        )}
        
        <div className={`logo-container ${isSearchOpen ? 'hidden' : ''}`}>
          <img src={currentLogoUrl} alt={logoAlt} className="logo-image" />
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
          style={{ color: 'var(--store-text-color, #000000)' }}
        >
          {isSearchOpen ? (
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 6C13.7614 6 16 8.23858 16 11M16.6588 16.6549L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      <AboutModal isOpen={isAboutOpen} isExiting={isAboutExiting} onClose={handleAboutClose} />
      <ContactModal isOpen={isContactOpen} isExiting={isContactExiting} onClose={handleContactClose} />
    </header>
  );
};

export default Header;