import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productImages } from '../data/products';
import AddToCartPopup from './AddToCartPopup';
import { useCart } from '../contexts/CartContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
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
}) => {
  const navigate = useNavigate();
  const { addToCart, removeFromCart, getItemQuantity, hasItems } = useCart();
  const productImage = productImages[image] || productImages.product1;
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

  const handleTrashClick = () => {
    removeFromCart(productId);
  };

  const handleBuyClick = () => {
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
    setIsPopupOpen(false);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

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

  // Ajustar máscara para última linha com texto real
  useEffect(() => {
    if (isExpanded || !textContentRef.current || !teDRef.current) {
      return;
    }

    const updateMaskPosition = () => {
      const textContent = textContentRef.current;
      const teD = teDRef.current;
      if (!textContent || !teD) return;

      // Encontrar todos os elementos de texto
      const textElements = Array.from(textContent.querySelectorAll('.product-description, .product-title')) as HTMLElement[];
      
      if (textElements.length === 0) return;

      // Encontrar a última linha com conteúdo real
      let lastLineBottom = 0;
      const containerRect = textContent.getBoundingClientRect();
      const maxHeight = parseFloat(getComputedStyle(textContent).maxHeight) || textContent.offsetHeight;
      
      // Percorrer elementos de trás para frente para encontrar o último com texto real
      for (let i = textElements.length - 1; i >= 0; i--) {
        const element = textElements[i];
        const text = element.textContent || '';
        
        // Verificar se tem conteúdo real (letras ou números, não apenas espaços)
        if (/\S/.test(text)) {
          const rect = element.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          const relativeBottom = rect.bottom - containerRect.top;
          
          // Se o elemento está dentro do limite de altura visível
          if (relativeTop < maxHeight) {
            // Se o elemento ultrapassa o limite, usar o limite
            const visibleBottom = Math.min(relativeBottom, maxHeight);
            
            // Tentar encontrar a última linha visível do elemento usando Range API
            try {
              const range = document.createRange();
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let lastTextNode: Node | null = null;
              let node: Node | null;
              while (node = walker.nextNode()) {
                if (node.textContent && /\S/.test(node.textContent)) {
                  lastTextNode = node;
                }
              }
              
              if (lastTextNode && lastTextNode.textContent) {
                const textContent = lastTextNode.textContent;
                // Encontrar o último caractere não-whitespace
                let lastCharIndex = textContent.length - 1;
                while (lastCharIndex >= 0 && /\s/.test(textContent[lastCharIndex])) {
                  lastCharIndex--;
                }
                
                if (lastCharIndex >= 0) {
                  range.setStart(lastTextNode, lastCharIndex);
                  range.setEnd(lastTextNode, lastCharIndex + 1);
                  const rects = range.getClientRects();
                  
                  if (rects.length > 0) {
                    const lastRect = rects[rects.length - 1];
                    const lineBottom = lastRect.bottom - containerRect.top;
                    if (lineBottom <= maxHeight && lineBottom > lastLineBottom) {
                      lastLineBottom = lineBottom;
                      break; // Encontramos a última linha visível
                    }
                  }
                }
              }
            } catch (e) {
              // Fallback: usar o bottom visível do elemento
            }
            
            // Se não encontramos com Range API, usar o bottom visível
            if (lastLineBottom === 0 || visibleBottom < lastLineBottom) {
              lastLineBottom = visibleBottom;
            }
            break; // Já encontramos o último elemento com texto
          }
        }
      }

      if (lastLineBottom > 0) {
        // Colocar a máscara em 100%
        teD.style.setProperty('--mask-start', '100%');
      } else {
        // Fallback: usar valor padrão
        teD.style.setProperty('--mask-start', '100%');
      }
    };

    // Aguardar o próximo frame para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateMaskPosition();
        });
      });
    }, 100);

    // Recalcular quando a janela for redimensionada
    window.addEventListener('resize', updateMaskPosition);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateMaskPosition);
    };
  }, [description1, description2, title, isExpanded]);

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
        <div className="product-image-wrapper" ref={imageRef}>
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
                <h3 className="product-title">{title}</h3>
                {description1 && <p className="product-description">{description1}</p>}
                {description2 && <p className="product-description">{description2}</p>}
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
              {showReadMoreTop && (
                <a 
                  href={`/product/${productId}`} 
                  className="readmore-link readmore-link-top" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/product/${productId}`);
                  }}
                >
                  <img src={addIcon} alt="Ver tudo" className="readmore-icon" />
                  <span className="readmore-text">Ver tudo</span>
                </a>
              )}
            <a href="#" className="readmore-link" onClick={handleReadMoreClick}>
              <svg className="readmore-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 13L12 16M12 16L15 13M12 16V8M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="readmore-text">{isExpanded ? 'Ler menos' : 'Ler mais'}</span>
            </a>
            </>
          )}
          <div className="price-container">
            {hasDiscount && oldPrice && oldPrice.trim() !== '' && oldPrice !== newPrice && (
              <>
                <span className="price-old">{oldPrice}</span>
                <span className="price-separator">|</span>
              </>
            )}
            <span className="price-new">{newPrice}</span>
          </div>
        </div>
        <div className="buy-btn-container">
          {cartHasItems && (
            <button className="trash-btn" onClick={handleTrashClick} aria-label="Remover do carrinho">
              <img src={trashIcon} alt="Remover" className="trash-icon" />
            </button>
          )}
          <button className={`buy-btn ${cartHasItems ? 'add-mode' : ''}`} onClick={handleBuyClick}>
            {cartHasItems ? 'ADICIONAR' : 'COMPRAR'}
          </button>
        </div>
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

export default ProductCard;

