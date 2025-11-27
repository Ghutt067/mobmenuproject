import { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSearch } from '../contexts/SearchContext';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import { getAllProducts, type Product } from '../services/productService';
import { getProductImage } from '../utils/imageHelper';
import { formatPrice } from '../utils/priceFormatter';
import { formatSelectedOptions } from '../utils/formatSelectedOptions';
import { formatProductTotalPrice } from '../utils/calculateProductPrice';
import trashIcon from '../icons/trash-svgrepo-com.svg';
import addIcon from '../icons/add-ellipse-svgrepo-com.svg';
import addIconGreen from '../icons/addicon.svg';
import './Cart.css';

function Cart() {
  const { navigate } = useStoreNavigation();
  const { getItemQuantity, addToCart, removeFromCart, cartItems } = useCart();
  const { searchTerm } = useSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [animatingQuantities, setAnimatingQuantities] = useState<Set<string>>(new Set());
  const [observations, setObservations] = useState('');

  // Garantir que a página sempre abre no topo
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  const handleBackClick = () => {
    // Garantir que a flag de navegação ativa esteja setada antes de voltar
    sessionStorage.setItem('navigationActive', 'true');
    // NÃO limpar a posição salva - ela será usada para restaurar o scroll
    navigate('');
  };

  const handleAddClick = (productId: string) => {
    addToCart(productId);
    // Remove da lista de itens sendo removidos se estiver lá
    setRemovingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
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

  const handleTrashClick = (productId: string) => {
    const currentQuantity = getItemQuantity(productId);
    
    // Se a quantidade atual é 1, vai chegar a 0, então iniciar animação
    if (currentQuantity === 1) {
      setRemovingItems((prev) => new Set(prev).add(productId));
      // Aguardar animação terminar antes de remover
      setTimeout(() => {
        removeFromCart(productId);
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 300); // Duração da animação
    } else {
      removeFromCart(productId);
    }
  };

  // Buscar produtos do banco de dados
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  // Filtrar apenas produtos que estão no carrinho (incluindo os que estão sendo removidos)
  const cartProductsBase = useMemo(() => {
    return products.filter((product) => {
      const quantity = getItemQuantity(product.id);
      return quantity > 0 || removingItems.has(product.id);
    });
  }, [products, getItemQuantity, removingItems]);

  // Filtrar produtos do carrinho baseado no termo de busca
  const cartProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return cartProductsBase;
    }

    const searchUpper = searchTerm.toUpperCase();
    return cartProductsBase.filter((product) => {
      const titleMatch = product.title.toUpperCase().indexOf(searchUpper) > -1;
      const desc1Match = product.description1?.toUpperCase().indexOf(searchUpper) > -1;
      const desc2Match = product.description2?.toUpperCase().indexOf(searchUpper) > -1;
      
      return titleMatch || desc1Match || desc2Match;
    });
  }, [cartProductsBase, searchTerm]);

  if (isLoading) {
    return (
      <main className="cart-content">
        <div className="cart-header">
          <h1 className="cart-title">Carrinho</h1>
          <button className="cart-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="cart-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        <div className="cart-empty">
          <p>Carregando produtos...</p>
        </div>
      </main>
    );
  }

  if (cartProducts.length === 0) {
    const isEmpty = cartProductsBase.length === 0;
    return (
      <main className="cart-content">
        <div className="cart-header">
          <h1 className="cart-title">Carrinho</h1>
          <button className="cart-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="cart-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        <div className="cart-empty">
          <p>{isEmpty ? 'Seu carrinho está vazio' : `Nenhum produto encontrado para "${searchTerm}"`}</p>
        </div>
        <div className="cart-add-button-container">
          <button className="cart-add-button" onClick={handleBackClick}>
            <img src={addIconGreen} alt="Adicionar" className="cart-add-icon" />
            Adicionar
          </button>
        </div>
      </main>
    );
  }

  const handleFinishOrder = () => {
    // Preservar a posição de scroll da Home se já existir
    // A posição será restaurada quando voltar para a Home
    navigate('/checkout');
  };

  return (
    <>
      <main className="cart-content">
        <div className="cart-header">
          <h1 className="cart-title">Carrinho</h1>
          <button className="cart-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <svg className="cart-back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff8d85"/>
            </svg>
          </button>
        </div>
        <div className={`cart-modal ${removingItems.size > 0 ? 'shrinking' : ''}`}>
          <div className="cart-items">
            {cartProducts.map((product) => {
              const quantity = getItemQuantity(product.id);
              const isRemoving = removingItems.has(product.id);
              // Usar a função getProductImage para obter a imagem corretamente
              const productImage = getProductImage(product.image);
              
              // Buscar opções selecionadas para este produto
              const cartItem = cartItems.find((item) => item.productId === product.id);
              const selectedOptionsText = formatSelectedOptions(product, cartItem?.selectedOptions);
              
              return (
                <div key={product.id} className={`cart-item ${isRemoving ? 'removing' : ''}`}>
                  <img
                    src={productImage}
                    alt={product.title}
                    className="cart-item-image"
                  />
                  <div className="cart-item-info">
                    <div className="cart-title-wrapper">
                      <h3 className="cart-item-title">{product.title}</h3>
                    </div>
                    {selectedOptionsText && (
                      <div className="cart-item-options">
                        <span className="cart-options-text">{selectedOptionsText}</span>
                      </div>
                    )}
                    <div className="cart-item-price">
                      {product.hasDiscount && product.oldPrice && product.oldPrice.trim() !== '' && product.oldPrice !== product.newPrice && (
                        <span className="cart-price-old">{formatPrice(product.oldPrice)}</span>
                      )}
                      <span className="cart-price-new">
                        {formatProductTotalPrice(product, cartItem?.selectedOptions)}
                      </span>
                    </div>
                    <div className="cart-item-quantity">
                      <span className="quantity-label">Quantidade:</span>
                      <span className={`quantity-value ${animatingQuantities.has(product.id) ? 'scale-up' : ''}`}>{quantity}</span>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <button 
                      className="cart-action-btn cart-add-btn" 
                      onClick={() => handleAddClick(product.id)}
                      aria-label="Adicionar produto"
                    >
                      <img src={addIcon} alt="Adicionar" className="cart-action-icon" />
                    </button>
                    <button 
                      className="cart-action-btn cart-trash-btn" 
                      onClick={() => handleTrashClick(product.id)}
                      aria-label="Remover produto"
                    >
                      <img src={trashIcon} alt="Remover" className="cart-action-icon" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div className="cart-observations">
          <h3 className="cart-section-title">Observações?</h3>
          <input
            type="text"
            className="cart-observations-input"
            placeholder="Observações sobre o pedido"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        {/* Botões */}
        <div className="cart-buttons-container">
          <button className="cart-add-button" onClick={handleBackClick}>
            <img src={addIconGreen} alt="Adicionar" className="cart-add-icon" />
            Adicionar
          </button>
          <button className="cart-finish-button" onClick={handleFinishOrder}>
            <div className="cart-finish-content">
              <span>Finalizar pedido</span>
            </div>
          </button>
        </div>
      </main>
    </>
  );
}

export default Cart;

