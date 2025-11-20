import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getAllProducts, type Product } from '../services/productService';
import { productImages } from '../data/products';
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
  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      const quantity = getItemQuantity(productId);
      
      // Se o produto existe e não está no carrinho, adiciona
      if (product && quantity === 0) {
        addToCart(productId);
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
    removeFromCart(productId);
  };


  const handleApplyCoupon = () => {
    // TODO: Implementar lógica de cupom
    console.log('Aplicar cupom:', couponCode);
  };

  const handleAddMoreItems = () => {
    navigate('/');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleNext = () => {
    navigate('/checkout/identification');
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
        <div className="checkout-modal">
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
                          <span className="checkout-price-old">{product.oldPrice}</span>
                        )}
                        <span className="checkout-price-new">{product.newPrice}</span>
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
      <div className="checkout-also-order">
        <h3 className="checkout-section-title">Peça também</h3>
        <div className="checkout-also-order-content">
          <div className="checkout-also-order-image">
            {/* Placeholder para produtos relacionados - em construção */}
          </div>
        </div>
      </div>

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
