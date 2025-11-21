import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getAllProducts, type Product } from '../services/productService';
import { productImages } from '../data/products';
import { formatPrice } from '../utils/priceFormatter';
import trashIcon from '../icons/trash-svgrepo-com.svg';
import addIcon from '../icons/add-ellipse-svgrepo-com.svg';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const { cartItems, addToCart, removeFromCart, getItemQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [observations, setObservations] = useState('');
  const [animatingQuantities, setAnimatingQuantities] = useState<Set<string>>(new Set());
  const [animatedTotal, setAnimatedTotal] = useState('0,00');
  const animationRef = useRef<number | null>(null);
  const previousTotalRef = useRef<string>('0,00');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalFirstAppearance, setIsModalFirstAppearance] = useState(false);
  const previousCartLengthRef = useRef<number>(0);
  // IDs dos produtos que devem aparecer no "Peça também"
  // Ordem: Produto 1, Produto 6, Produto 4, Produto 2, Produto 5 (todos da seção 2 - COMPLEMENTOS)
  const [alsoOrderProductIds] = useState<string[]>([
    '7028cc82-ad0c-49b2-954a-62efa28de896', // Produto 1: Alfajor Tradicional
    'd72803b0-bf5a-417a-9bff-29e00bc28b4b', // Produto 6: Doce de Leite com Café
    'de89616b-5ca8-4582-8985-c91c80d68f57', // Produto 4: Kit 4 Queijos de Alagoa-MG
    '8b41fd0e-bf2b-4e2f-a0d9-0d0115b1310f', // Produto 2: 4 Queijos de Alagoa + Geleia de Pimenta
    '61b7a3a7-beee-4137-b2dc-0ed46e4c0dbe', // Produto 5: Bala de Doce de Leite 300g
  ]);
  const alsoOrderGridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragStartXRef = useRef(0);
  const isMouseDownRef = useRef(false);
  // Flag para controlar se o produto da rota já foi adicionado automaticamente
  const autoAddedProductRef = useRef<string | null>(null);
  // Flag para controlar se produtos foram manualmente removidos (não re-adicionar automaticamente)
  const manuallyRemovedProductsRef = useRef<Set<string>>(new Set());

  // Garantir que a página sempre abre no topo
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Adiciona o produto automaticamente se vier da rota e não estiver no carrinho
  // Só adiciona uma vez, quando a página carrega pela primeira vez
  // Não re-adiciona se o produto foi manualmente removido
  useEffect(() => {
    if (productId && products.length > 0 && autoAddedProductRef.current !== productId) {
      // Não adicionar se o produto foi manualmente removido
      if (manuallyRemovedProductsRef.current.has(productId)) {
        return;
      }
      
      const product = products.find(p => p.id === productId);
      const quantity = getItemQuantity(productId);
      
      // Se o produto existe e não está no carrinho, adiciona apenas uma vez
      if (product && quantity === 0) {
        addToCart(productId);
        autoAddedProductRef.current = productId;
        // Remover flag após adicionar - agora o modo de adicionar ao carrinho pode ser ativado
        sessionStorage.removeItem('comingFromContinuePurchase');
      }
    }
  }, [productId, products, getItemQuantity, addToCart]);

  // Filtrar produtos que estão no carrinho
  const cartProducts = useMemo(() => {
    return products.filter((product) => {
      const quantity = getItemQuantity(product.id);
      return quantity > 0;
    });
  }, [products, cartItems, getItemQuantity]);

  // Detectar quando o segundo produto é adicionado (animação do modal)
  useEffect(() => {
    const currentLength = cartProducts.length;
    const previousLength = previousCartLengthRef.current;
    
    // Animar sempre que o segundo produto é adicionado (passa de 1 para 2)
    if (currentLength === 2 && previousLength === 1) {
      setIsModalFirstAppearance(true);
      // Remover a classe de animação após a animação terminar
      const timer = setTimeout(() => {
        setIsModalFirstAppearance(false);
      }, 400); // Duração da animação + um pouco mais
      previousCartLengthRef.current = currentLength;
      return () => clearTimeout(timer);
    } else if (currentLength === 0) {
      // Resetar quando o carrinho fica vazio
      setIsModalFirstAppearance(false);
      previousCartLengthRef.current = 0;
    } else if (currentLength === 1 && previousLength > 1) {
      // Quando volta para 1 produto (removeu produtos), resetar para permitir nova animação
      setIsModalFirstAppearance(false);
      previousCartLengthRef.current = currentLength;
    } else {
      // Atualizar referência do comprimento anterior
      previousCartLengthRef.current = currentLength;
    }
  }, [cartProducts.length]);

  // Filtrar produtos para "Peça também" - mantém todos os produtos visíveis mesmo após adicionar ao carrinho
  // Mantém a ordem especificada no array alsoOrderProductIds
  const alsoOrderProducts = useMemo(() => {
    if (alsoOrderProductIds.length === 0) return [];
    
    // Criar um mapa para manter a ordem
    const productMap = new Map<string, Product>();
    products.forEach((product) => {
      // Inclui todos os produtos da lista, independente de estarem no carrinho
      if (alsoOrderProductIds.includes(product.id)) {
        productMap.set(product.id, product);
      }
    });
    
    // Retornar na ordem especificada
    return alsoOrderProductIds
      .map((id) => productMap.get(id))
      .filter((product): product is Product => product !== undefined);
  }, [products, alsoOrderProductIds]);

  // Calcular total do carrinho
  const cartTotal = useMemo(() => {
    if (cartItems.length === 0) {
      return '0,00';
    }
    let total = 0;
    cartItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // Remove R$, espaços e converte vírgula para ponto
        const priceStr = product.newPrice.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
        const price = parseFloat(priceStr) || 0;
        total += price * item.quantity;
      }
    });
    // Formata o total com 2 casas decimais e vírgula como separador decimal
    return total.toFixed(2).replace('.', ',');
  }, [cartItems, products]);

  // Inicializar o valor animado quando os produtos carregarem
  useEffect(() => {
    if (!isLoading && cartTotal !== animatedTotal && previousTotalRef.current === '0,00') {
      setAnimatedTotal(cartTotal);
      previousTotalRef.current = cartTotal;
    }
  }, [isLoading, cartTotal, animatedTotal]);

  // Animar o valor total
  useEffect(() => {
    // Se o valor não mudou, não animar
    if (cartTotal === previousTotalRef.current) {
      return;
    }

    // Cancelar animação anterior se existir
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const targetValue = parseFloat(cartTotal.replace(',', '.')) || 0;
    const startValue = parseFloat(previousTotalRef.current.replace(',', '.')) || 0;
    
    // Atualizar referência do valor anterior
    previousTotalRef.current = cartTotal;

    const duration = 600; // 0.6 segundos
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function para animação suave (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      const formattedValue = currentValue.toFixed(2).replace('.', ',');
      setAnimatedTotal(formattedValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedTotal(cartTotal);
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cartTotal]);

  const handleAddClick = (productId: string) => {
    addToCart(productId);
    // Adicionar animação de escala
    setAnimatingQuantities((prev) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
    setTimeout(() => {
      setAnimatingQuantities((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 300);
  };

  const handleRemoveClick = (productId: string) => {
    // Marcar o produto como manualmente removido para não ser re-adicionado automaticamente
    manuallyRemovedProductsRef.current.add(productId);
    // Limpar a flag de auto-adicionado se for o mesmo produto
    if (autoAddedProductRef.current === productId) {
      autoAddedProductRef.current = null;
    }
    removeFromCart(productId);
  };


  const handleApplyCoupon = () => {
    // TODO: Implementar lógica de cupom
    console.log('Aplicar cupom:', couponCode);
  };

  const handleAddMoreItems = () => {
    // Garantir que a flag de navegação ativa esteja setada antes de voltar
    sessionStorage.setItem('navigationActive', 'true');
    navigate('/');
  };

  const handleBackClick = () => {
    // Garantir que a flag de navegação ativa esteja setada antes de voltar
    sessionStorage.setItem('navigationActive', 'true');
    navigate('/');
  };

  const handleNext = () => {
    navigate('/checkout/identification');
  };

  // Handlers para drag scroll no desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Não iniciar drag se clicar diretamente em botão
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    if (!alsoOrderGridRef.current) return;
    isMouseDownRef.current = true;
    dragStartXRef.current = e.clientX;
    isDraggingRef.current = false; // Só ativa após movimento significativo
    startXRef.current = e.pageX - alsoOrderGridRef.current.offsetLeft;
    scrollLeftRef.current = alsoOrderGridRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!alsoOrderGridRef.current) return;
    isMouseDownRef.current = false;
    isDraggingRef.current = false;
    alsoOrderGridRef.current.style.cursor = 'grab';
    alsoOrderGridRef.current.style.userSelect = 'auto';
  };

  const handleMouseUp = () => {
    if (!alsoOrderGridRef.current) return;
    isMouseDownRef.current = false;
    isDraggingRef.current = false;
    alsoOrderGridRef.current.style.cursor = 'grab';
    alsoOrderGridRef.current.style.userSelect = 'auto';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!alsoOrderGridRef.current || !isMouseDownRef.current) return;
    
    // Só ativa drag se o mouse estiver pressionado E houver movimento significativo
    if (!isDraggingRef.current) {
      const moveDistance = Math.abs(e.clientX - dragStartXRef.current);
      // Só ativa drag se moveu mais de 10px (threshold maior para evitar ativação acidental)
      if (moveDistance > 10) {
        isDraggingRef.current = true;
        alsoOrderGridRef.current.style.cursor = 'grabbing';
        alsoOrderGridRef.current.style.userSelect = 'none';
      }
    }
    
    // Só faz scroll se realmente estiver em modo drag
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const x = e.pageX - alsoOrderGridRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 2; // Velocidade do scroll
      alsoOrderGridRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  if (isLoading) {
    return (
      <main className="checkout-content">
        <div className="checkout-header">
          <h1 className="checkout-title">Finalizar pedido</h1>
          <button className="checkout-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="checkout-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        <div className="checkout-empty">
          <p>Carregando produtos...</p>
        </div>
      </main>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <main className="checkout-content">
        <div className="checkout-header">
          <h1 className="checkout-title">Finalizar pedido</h1>
          <button className="checkout-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="checkout-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        <div className="checkout-empty">
          <p>Seu carrinho está vazio</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="checkout-content">
        <div className="checkout-header">
          <h1 className="checkout-title">Finalizar pedido</h1>
          <button className="checkout-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="checkout-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        {/* Lista de itens do carrinho */}
        <div className={`checkout-modal ${isModalFirstAppearance ? 'modal-grow' : ''}`}>
          <div className={`checkout-items-wrapper ${isExpanded ? 'expanded' : ''} ${cartProducts.length === 1 ? 'single-item' : ''}`}>
            <div className="checkout-items">
              {cartProducts.map((product) => {
                const quantity = getItemQuantity(product.id);
                const productImage = productImages[product.image] || productImages.product1;
                
                return (
                  <div key={product.id} className="checkout-item">
                    <img
                      src={productImage}
                      alt={product.title}
                      className="checkout-item-image"
                    />
                    <div className="checkout-item-info">
                      <div className="checkout-title-wrapper">
                        <h3 className="checkout-item-title">{product.title}</h3>
                      </div>
                      <div className="checkout-item-price">
                        {product.hasDiscount && product.oldPrice && product.oldPrice.trim() !== '' && product.oldPrice !== product.newPrice && (
                          <span className="checkout-price-old">{formatPrice(product.oldPrice)}</span>
                        )}
                        <span className="checkout-price-new">{formatPrice(product.newPrice)}</span>
                      </div>
                      <div className="checkout-item-quantity">
                        <span className="quantity-label">Quantidade:</span>
                        <span className={`quantity-value ${animatingQuantities.has(product.id) ? 'scale-up' : ''}`}>{quantity}</span>
                      </div>
                    </div>
                    <div className="checkout-item-actions">
                      <button 
                        className="checkout-action-btn checkout-add-btn" 
                        onClick={() => handleAddClick(product.id)}
                        aria-label="Adicionar produto"
                      >
                        <img src={addIcon} alt="Adicionar" className="checkout-action-icon" />
                      </button>
                      <button 
                        className="checkout-action-btn checkout-trash-btn" 
                        onClick={() => handleRemoveClick(product.id)}
                        aria-label="Remover produto"
                      >
                        <img src={trashIcon} alt="Remover" className="checkout-action-icon" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {cartProducts.length >= 2 && (
            <button 
              className="checkout-expand-btn" 
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Recolher' : 'Expandir'}
            >
              <svg className={`checkout-expand-icon ${isExpanded ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 13L12 16M12 16L15 13M12 16V8M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="checkout-expand-text">{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
            </button>
          )}
        </div>

      {/* Seção "Peça também" - Opcional */}
      {alsoOrderProducts.length > 0 && (
      <div className="checkout-also-order">
        <h3 className="checkout-section-title">Peça também</h3>
        <div className="checkout-also-order-content">
            <div 
              className="checkout-also-order-grid"
              ref={alsoOrderGridRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {alsoOrderProducts.map((product) => {
                const productImage = productImages[product.image] || productImages.product1;
                return (
                  <div 
                    key={product.id} 
                    className="checkout-also-order-item" 
                    onMouseDown={(e) => {
                      // Não iniciar drag se clicar no botão
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      
                      // Permitir que o drag funcione mesmo clicando no item
                      // Mas marcar posição inicial para detectar se foi arrasto ou clique
                      if (!alsoOrderGridRef.current) return;
                      isMouseDownRef.current = true;
                      dragStartXRef.current = e.clientX;
                      startXRef.current = e.pageX - alsoOrderGridRef.current.offsetLeft;
                      scrollLeftRef.current = alsoOrderGridRef.current.scrollLeft;
                    }}
                    onMouseMove={(e) => {
                      // Usar a mesma lógica do grid para detectar drag
                      if (!alsoOrderGridRef.current || !isMouseDownRef.current) return;
                      
                      // Só ativa drag se o mouse estiver pressionado E houver movimento significativo
                      if (!isDraggingRef.current) {
                        const moveDistance = Math.abs(e.clientX - dragStartXRef.current);
                        // Só ativa drag se moveu mais de 10px
                        if (moveDistance > 10) {
                          isDraggingRef.current = true;
                          alsoOrderGridRef.current.style.cursor = 'grabbing';
                          alsoOrderGridRef.current.style.userSelect = 'none';
                        }
                      }
                      
                      // Só faz scroll se realmente estiver em modo drag
                      if (isDraggingRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        const x = e.pageX - alsoOrderGridRef.current.offsetLeft;
                        const walk = (x - startXRef.current) * 2;
                        alsoOrderGridRef.current.scrollLeft = scrollLeftRef.current - walk;
                      }
                    }}
                    onMouseUp={() => {
                      if (!alsoOrderGridRef.current) return;
                      isMouseDownRef.current = false;
                      isDraggingRef.current = false;
                      alsoOrderGridRef.current.style.cursor = 'grab';
                      alsoOrderGridRef.current.style.userSelect = 'auto';
                    }}
                    onMouseLeave={() => {
                      if (!alsoOrderGridRef.current) return;
                      isMouseDownRef.current = false;
                      isDraggingRef.current = false;
                      alsoOrderGridRef.current.style.cursor = 'grab';
                      alsoOrderGridRef.current.style.userSelect = 'auto';
                    }}
                    onClick={(e) => {
                      // Não navegar se clicar no botão de adicionar
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      
                      // Só navega se não estiver arrastando (movimento < 10px)
                      const moveDistance = Math.abs(e.clientX - dragStartXRef.current);
                      if (!isDraggingRef.current && moveDistance < 10) {
                        // Salvar posição de scroll antes de navegar
                        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                        if (scrollPosition > 0) {
                          sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
                        }
                        sessionStorage.setItem('navigationActive', 'true');
                        // Passar estado indicando que veio do checkout
                        navigate(`/product/${product.id}`, { state: { fromCheckout: true } });
                      }
                    }}
                  >
                    <img
                      src={productImage}
                      alt={product.title}
                      className="checkout-also-order-image"
                    />
                    <div className="checkout-also-order-info">
                      <h4 className="checkout-also-order-title">{product.title}</h4>
                      <div className="checkout-also-order-price">
                        {product.hasDiscount && product.oldPrice && product.oldPrice.trim() !== '' && product.oldPrice !== product.newPrice && (
                          <span className="checkout-also-order-price-old">{formatPrice(product.oldPrice)}</span>
                        )}
                        <span className="checkout-also-order-price-new">{formatPrice(product.newPrice)}</span>
                      </div>
                    </div>
                    <button 
                      className="checkout-also-order-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddClick(product.id);
                      }}
                      aria-label="Adicionar ao carrinho"
                    >
                      <img src={addIcon} alt="Adicionar" className="checkout-also-order-add-icon" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Seção de Cupom */}
      <div className="checkout-coupon">
        <h3 className="checkout-section-title">
          Aplicar cupom
          <span className="checkout-optional">(Opcional)</span>
        </h3>
        <div className="checkout-coupon-input-wrapper">
          <svg className="checkout-coupon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5L10 10L17.5 5M2.5 15H17.5V5H2.5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            className="checkout-coupon-input"
            placeholder="Código do cupom"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
        </div>
        <button 
          className="checkout-coupon-btn"
          onClick={handleApplyCoupon}
        >
          Aplicar cupom
        </button>
      </div>

      {/* Total */}
      <div className="checkout-total">
        <span className="checkout-total-label">Total</span>
        <span className="checkout-total-value">R$ {animatedTotal}</span>
      </div>

      {/* Observações */}
      <div className="checkout-observations">
        <h3 className="checkout-section-title">Observações?</h3>
        <input
          type="text"
          className="checkout-observations-input"
          placeholder="Observações sobre o pedido"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
      </div>

      </main>
      <div className="checkout-finish-button-container">
        <div className="checkout-buttons-wrapper">
          <button className="checkout-btn-secondary" onClick={handleAddMoreItems}>
            Adicionar mais itens
          </button>
          <button className="checkout-finish-button" onClick={handleNext}>
            <div className="checkout-finish-content">
              <span>Próximo</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

export default Checkout;
