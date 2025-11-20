import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getProductById, type Product } from '../services/productService';
import { productImages } from '../data/products';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/priceFormatter';
import AddToCartPopup from '../components/AddToCartPopup';
import backIcon from '../icons/backicon.svg';
import './ProductDetails.css';

function ProductDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams<{ productId: string }>();
  const { addToCart, hasItems, getItemQuantity } = useCart();
  // Verificar se veio do checkout (modal "Peça também")
  const fromCheckout = (location.state as { fromCheckout?: boolean })?.fromCheckout || false;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showFixedButton, setShowFixedButton] = useState(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setIsLoading(true);
        // Usar função otimizada para buscar apenas um produto
        const foundProduct = await getProductById(productId);
        setProduct(foundProduct || null);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Observar visibilidade do botão original
  useEffect(() => {
    if (!buyButtonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Mostrar botão fixo quando o original não está visível
        setShowFixedButton(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    observer.observe(buyButtonRef.current);

    return () => {
      if (buyButtonRef.current) {
        observer.unobserve(buyButtonRef.current);
      }
    };
  }, [product]);

  const handleBackClick = () => {
    // Garantir que a flag de navegação ativa esteja setada antes de voltar
    sessionStorage.setItem('navigationActive', 'true');
    // Voltar para a página anterior no histórico do navegador
    navigate(-1);
  };

  const handleBuyClick = () => {
    if (!product) return;
    
    // Se veio do checkout, adiciona diretamente ao carrinho e volta
    if (fromCheckout) {
      addToCart(product.id);
      navigate(-1);
    } else if (hasItems()) {
      // Se há itens no carrinho (modo "adicionar"), adiciona diretamente
      addToCart(product.id);
      // Voltar para a Home após adicionar
      sessionStorage.setItem('navigationActive', 'true');
      navigate('/');
    } else {
      // Se não houver itens, mostra o popup
      setIsPopupOpen(true);
    }
  };

  const handleContinue = () => {
    if (!product) return;
    setIsPopupOpen(false);
    addToCart(product.id);
    // Voltar para a Home após adicionar e ir para checkout
    sessionStorage.setItem('navigationActive', 'true');
    navigate(`/checkout/${product.id}`);
  };

  const handleAdd = () => {
    if (!product) return;
    addToCart(product.id);
    setIsPopupOpen(false);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  if (isLoading) {
    return (
      <div className="product-details-container">
        <div className="product-details-loading">Carregando...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-container">
        <div className="product-details-header">
          <button className="product-details-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <img src={backIcon} alt="Voltar" className="product-details-back-icon" />
            <span className="product-details-back-text">voltar</span>
          </button>
        </div>
        <div className="product-details-error">Produto não encontrado</div>
      </div>
    );
  }

  const productImage = productImages[product.image] || productImages.product1;
  
  // Verificar se o produto já está no carrinho
  const productQuantity = productId ? getItemQuantity(productId) : 0;
  const isProductInCart = productQuantity > 0;
  
  // Determinar o texto do botão
  // Se o produto tem forceBuyButton=true, sempre mostra "COMPRAR"
  // Se há itens no carrinho (modo "adicionar") E o produto não está no carrinho → "ADICIONAR"
  // Ou se veio do checkout E o produto não está no carrinho → "ADICIONAR"
  // Caso contrário → "COMPRAR"
  const forceBuyButton = product?.forceBuyButton || false;
  const isAddMode = hasItems() || fromCheckout;
  const buttonText = forceBuyButton ? 'COMPRAR' : ((isAddMode && !isProductInCart) ? 'ADICIONAR' : 'COMPRAR');

  return (
    <>
      <div className="product-details-container">
        <div className="product-details-header">
          <button className="product-details-back-btn" onClick={handleBackClick} aria-label="Voltar">
            <img src={backIcon} alt="Voltar" className="product-details-back-icon" />
            <span className="product-details-back-text">voltar</span>
          </button>
        </div>
        
        <div className="product-details-image-wrapper">
          <img 
            src={productImage} 
            alt={product.title} 
            className="product-details-image"
          />
        </div>

        <div className="product-details-content">
          <h1 className="product-details-title">{product.title}</h1>
          
          {product.description1 && (
            <p className="product-details-description">{product.description1}</p>
          )}
          
          {product.description2 && (
            <p className="product-details-description">{product.description2}</p>
          )}

          {product.fullDescription && (
            <div className="product-details-full-description">
              {product.fullDescription.split('\n').map((line, index) => (
                line ? (
                  <p key={index} className="product-details-description">{line}</p>
                ) : (
                  <br key={index} />
                )
              ))}
            </div>
          )}

          <div className="product-details-price-container">
            {product.hasDiscount && product.oldPrice && product.oldPrice.trim() !== '' && product.oldPrice !== product.newPrice && (
              <>
                <span className="product-details-price-old">{formatPrice(product.oldPrice)}</span>
                <span className="product-details-price-separator">|</span>
              </>
            )}
            <span className="product-details-price-new">{formatPrice(product.newPrice)}</span>
          </div>

          <button 
            ref={buyButtonRef}
            className="product-details-buy-btn" 
            onClick={handleBuyClick}
          >
            {buttonText}
          </button>
        </div>
      </div>
      
      {/* Botão fixo duplicado */}
      {showFixedButton && (
        <button 
          className="product-details-buy-btn-fixed" 
          onClick={handleBuyClick}
        >
          {buttonText}
        </button>
      )}
      
      <AddToCartPopup
        isOpen={isPopupOpen}
        onContinue={handleContinue}
        onAdd={handleAdd}
        onClose={handleClose}
      />
    </>
  );
}

export default ProductDetails;

