import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getProductImage } from '../utils/imageHelper';
import AddToCartPopup from './AddToCartPopup';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import { formatPrice } from '../utils/priceFormatter';
import trashIcon from '../icons/trash-svgrepo-com.svg';
import addIcon from '../icons/addicon.svg';
import './ProductCard.css';

interface ProductCardProps {
  productId: string;
  image: string;
  title: string;
  description1: string;
  description2: string;
  oldPrice: string;
  newPrice: string;
  fullDescription?: string;
  hasDiscount?: boolean;
  priority?: boolean; // Se true, carrega imediatamente (produtos acima da dobra)
  previewMode?: boolean; // Se true, desabilita navegação (para preview na página de personalização)
}

const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  image,
  title,
  description1,
  description2,
  oldPrice,
  newPrice,
  fullDescription,
  hasDiscount = false,
  priority = false,
  previewMode = false,
}) => {
  const { navigate } = useStoreNavigation();
  const { store } = useStore();
  const { addToCart, removeFromCart, getItemQuantity, hasItems } = useCart();
  const productImage = getProductImage(image);
  const [imageRef, isImageVisibleFromObserver] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.01,
    rootMargin: '100px', // Começar a carregar 100px antes de entrar na tela
    triggerOnce: true,
  });
  // Se for priority, considera visível desde o início
  const isImageVisible = priority || isImageVisibleFromObserver;
  const [imageLoaded, setImageLoaded] = useState(priority); // Se priority, já marca como carregando
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMoreTop, setShowReadMoreTop] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const textContentRef = useRef<HTMLDivElement>(null);
  const teDRef = useRef<HTMLDivElement>(null);

  // Função para converter hex para rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Aplicar gradiente dinâmico baseado na cor de fundo da loja
  useEffect(() => {
    if (!teDRef.current) return;
    
    const backgroundColor = store?.customizations?.backgroundColor || '#FFFFFF';
    
    // Criar gradiente com a cor de fundo
    const gradientNormal = `linear-gradient(to bottom, transparent 0%, ${hexToRgba(backgroundColor, 0.2)} 15%, ${hexToRgba(backgroundColor, 0.4)} 30%, ${hexToRgba(backgroundColor, 0.6)} 50%, ${hexToRgba(backgroundColor, 0.8)} 70%, ${hexToRgba(backgroundColor, 0.92)} 85%, ${hexToRgba(backgroundColor, 0.98)} 95%, ${backgroundColor} 100%)`;
    const gradientExpanded = `linear-gradient(to bottom, transparent 0%, ${hexToRgba(backgroundColor, 0.1)} calc((100% - 95px) + 10px), ${hexToRgba(backgroundColor, 0.3)} calc((100% - 95px) + 25px), ${hexToRgba(backgroundColor, 0.55)} calc((100% - 95px) + 45px), ${hexToRgba(backgroundColor, 0.75)} calc((100% - 95px) + 55px), ${hexToRgba(backgroundColor, 0.88)} calc((100% - 95px) + 65px), ${hexToRgba(backgroundColor, 0.95)} calc((100% - 95px) + 75px), ${hexToRgba(backgroundColor, 0.98)} calc((100% - 95px) + 85px), ${backgroundColor} 100%)`;
    
    // Aplicar via CSS custom property
    teDRef.current.style.setProperty('--gradient-normal', gradientNormal);
    teDRef.current.style.setProperty('--gradient-expanded', gradientExpanded);
  }, [store?.customizations?.backgroundColor, isExpanded]);

  const quantity = getItemQuantity(productId);
  const cartHasItems = hasItems();
  const [animationKey, setAnimationKey] = useState(0);
  const prevQuantityRef = useRef(quantity);

  useEffect(() => {
    const prevQuantity = prevQuantityRef.current;
    
    // Atualizar a referência primeiro
    prevQuantityRef.current = quantity;
    
    // Se a quantidade diminuiu, não animar
    if (quantity < prevQuantity) {
      return;
    }
    
    // Se a quantidade aumentou, reiniciar animação imediatamente
    if (quantity > prevQuantity && quantity > 0) {
      // Forçar reinício da animação mudando a chave
      setAnimationKey(prev => prev + 1);
    }
  }, [quantity]);

  const handleTrashClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    removeFromCart(productId);
  };

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Se já houver itens no carrinho, adiciona diretamente sem popup
    if (cartHasItems) {
      addToCart(productId);
    } else {
      // Se não houver itens, mostra o popup
      setIsPopupOpen(true);
    }
  };

  const handleContinue = () => {
    setIsPopupOpen(false);
    // Salvar posição de scroll antes de navegar
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
    // Adiciona o produto ao carrinho antes de navegar
    addToCart(productId);
    navigate(`/checkout/${productId}`);
  };

  const handleAdd = () => {
    addToCart(productId);
    // Não fechar imediatamente - deixar o AddToCartPopup gerenciar o fechamento com animação
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  const formattedOldPrice = useMemo(() => formatPrice(oldPrice), [oldPrice]);
  const formattedNewPrice = useMemo(() => formatPrice(newPrice), [newPrice]);

  const handleProductClick = useCallback(() => {
    if (previewMode) return; // Não navegar em modo preview
    // Salvar posição de scroll antes de navegar
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
    sessionStorage.setItem('navigationActive', 'true');
    navigate(`/produto/${productId}`);
  }, [productId, navigate, previewMode]);

  const handleReadMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    const link = e.currentTarget;
    const productCard = link.closest('.product-card') as HTMLElement;
    
    if (!productCard) return;
    
    const readmoreElement = productCard.querySelector('.readmore') as HTMLElement;
    if (!readmoreElement) return;
    
    // Toggle the expand state
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    if (newExpandedState) {
      readmoreElement.classList.add('expand');
      // Mostrar o link "Ver tudo" quando a animação estiver 20% completa (100ms de 500ms)
      setTimeout(() => {
        setShowReadMoreTop(true);
      }, 100);
    } else {
      readmoreElement.classList.remove('expand');
      // Esconder imediatamente quando colapsar
      setShowReadMoreTop(false);
    }
  };

  // Ajustar máscara para última linha com texto real - OTIMIZADO
  useEffect(() => {
    if (isExpanded || !textContentRef.current || !teDRef.current) {
      return;
    }

    // Função simplificada e otimizada - evita cálculos pesados de Range API
    const updateMaskPosition = () => {
      const textContent = textContentRef.current;
      const teD = teDRef.current;
      if (!textContent || !teD) return;

      // Usar cálculo simples baseado na altura do container
      // Evita TreeWalker e Range API que são muito pesados
      const maxHeight = parseFloat(getComputedStyle(textContent).maxHeight) || textContent.offsetHeight;
      const actualHeight = textContent.scrollHeight;
      
      // Se o conteúdo cabe, não precisa de máscara
      if (actualHeight <= maxHeight) {
        teD.style.setProperty('--mask-start', '100%');
        return;
      }

      // Calcular posição da máscara de forma simples
      // Usar 100% como padrão (máscara no final)
      teD.style.setProperty('--mask-start', '100%');
    };

    // Usar requestIdleCallback se disponível, senão setTimeout
    const scheduleUpdate = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(updateMaskPosition, { timeout: 200 });
      } else {
        setTimeout(updateMaskPosition, 100);
      }
    };

    scheduleUpdate();

    // Debounce resize para evitar muitas chamadas
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateMaskPosition, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [description1, description2, fullDescription, title, isExpanded]);

  // Preload da imagem quando estiver visível ou próxima
  useEffect(() => {
    // Se for priority, carrega imediatamente
    if (priority) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageError(true);
      };
      img.src = productImage;
      return;
    }
    
    // Caso contrário, só carrega quando estiver visível
    if (isImageVisible && !imageLoaded && !imageError) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageError(true);
      };
      img.src = productImage;
    }
  }, [isImageVisible, productImage, imageLoaded, imageError, priority]);

  return (
    <>
      <div className="product-card">
        <div className="product-image-wrapper" ref={imageRef} onClick={handleProductClick}>
          {!imageLoaded && !imageError && (
            <div className="product-image-placeholder" />
          )}
          {(isImageVisible || priority) && (
            <img 
              src={productImage}
              alt={title} 
              className="product-image"
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
              style={{ 
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                position: imageLoaded ? 'relative' : 'absolute',
                top: imageLoaded ? 'auto' : 0,
                left: imageLoaded ? 'auto' : 0,
                width: '100%',
                height: '200px'
              }}
            />
          )}
          {quantity > 0 && (
            <>
              <div className="product-image-overlay"></div>
              <div key={animationKey} className="product-quantity-badge bounce-up">{quantity}</div>
            </>
          )}
        </div>
        <div className="product-content">
          <div className="TeD" ref={teDRef}>
            <div className="product-text-wrapper">
              <div className="product-text-content readmore" ref={textContentRef}>
                <h3 className="product-title" onClick={handleProductClick}>{title}</h3>
                {/* Se houver description1 ou description2, mostrar eles (comportamento antigo) */}
                {description1 && <p className="product-description" onClick={handleProductClick}>{description1}</p>}
                {description2 && <p className="product-description" onClick={handleProductClick}>{description2}</p>}
                
                {/* Se não houver description1/description2 mas houver fullDescription, mostrar prévia */}
                {!description1 && !description2 && fullDescription && !isExpanded && (
                  <div className="product-description-preview">
                    {fullDescription.split('\n').filter(line => line.trim()).slice(0, 2).map((line, index) => (
                      <p key={index} className="product-description" onClick={handleProductClick}>{line}</p>
                    ))}
                    {fullDescription.split('\n').filter(line => line.trim()).length > 2 && (
                      <p className="product-description" onClick={handleProductClick}>...</p>
                    )}
                  </div>
                )}
                
                {/* Quando expandido, mostrar fullDescription completo */}
                {isExpanded && fullDescription && (
                  <div className="product-full-description">
                    {fullDescription.split('\n').map((line, index) => (
                      line ? (
                        <p key={index} className="product-description">{line}</p>
                      ) : (
                        <br key={index} />
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {fullDescription && (
            <>
              {showReadMoreTop && !previewMode && (
                <a 
                  href={`/product/${productId}`} 
                  className="readmore-link readmore-link-top" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                    if (scrollPosition > 0) {
                      sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
                    }
                    navigate(`/produto/${productId}`);
                  }}
                >
                  <img src={addIcon} alt="Ver tudo" className="readmore-icon" />
                  <span className="readmore-text">Ver tudo</span>
                </a>
              )}
            <a href="#" className="readmore-link" onClick={(e) => {
              e.stopPropagation();
              handleReadMoreClick(e);
            }}>
              <svg className="readmore-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 13L12 16M12 16L15 13M12 16V8M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="readmore-text">{isExpanded ? 'Ler menos' : 'Ler mais'}</span>
            </a>
            </>
          )}
          <div className="price-container" onClick={handleProductClick}>
            {hasDiscount && oldPrice && oldPrice.trim() !== '' && formattedOldPrice && formattedOldPrice.trim() !== '' && formattedOldPrice !== formattedNewPrice && (
              <>
                <span className="price-old">{formattedOldPrice}</span>
                <span className="price-separator">|</span>
              </>
            )}
            <span className="price-new">{formattedNewPrice}</span>
          </div>
        </div>
        {store?.customizations?.showBuyButton !== false && (
          <div className="buy-btn-container" onClick={(e) => e.stopPropagation()}>
            {cartHasItems && (
              <button className="trash-btn" onClick={handleTrashClick} aria-label="Remover do carrinho">
                <img src={trashIcon} alt="Remover" className="trash-icon" />
              </button>
            )}
            <button className={`buy-btn ${cartHasItems ? 'add-mode' : ''}`} onClick={handleBuyClick}>
              {cartHasItems ? 'ADICIONAR' : 'COMPRAR'}
            </button>
          </div>
        )}
      </div>
      <AddToCartPopup
        isOpen={isPopupOpen}
        onContinue={handleContinue}
        onAdd={handleAdd}
        onClose={handleClose}
      />
    </>
  );
};

// Memoizar componente para evitar re-renders desnecessários
export default React.memo(ProductCard);

