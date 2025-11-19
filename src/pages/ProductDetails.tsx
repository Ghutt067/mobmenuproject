import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllProducts, type Product } from '../services/productService';
import { productImages } from '../data/products';
import { useCart } from '../contexts/CartContext';
import AddToCartPopup from '../components/AddToCartPopup';
import './ProductDetails.css';

function ProductDetails() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { addToCart, hasItems } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const products = await getAllProducts();
        const foundProduct = products.find(p => p.id === productId);
        setProduct(foundProduct || null);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBuyClick = () => {
    if (!product) return;
    
    // Se já houver itens no carrinho, adiciona diretamente sem popup
    if (hasItems()) {
      addToCart(product.id);
    } else {
      // Se não houver itens, mostra o popup
      setIsPopupOpen(true);
    }
  };

  const handleContinue = () => {
    if (!product) return;
    setIsPopupOpen(false);
    addToCart(product.id);
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
        <div className="product-details-error">Produto não encontrado</div>
        <button className="product-details-back-btn" onClick={handleBackClick}>
          Voltar
        </button>
      </div>
    );
  }

  const productImage = productImages[product.image] || productImages.product1;

  return (
    <>
      <div className="product-details-container">
        <button className="product-details-back-btn" onClick={handleBackClick}>
          ← Voltar
        </button>
        
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
                <span className="product-details-price-old">{product.oldPrice}</span>
                <span className="product-details-price-separator">|</span>
              </>
            )}
            <span className="product-details-price-new">{product.newPrice}</span>
          </div>

          <button className="product-details-buy-btn" onClick={handleBuyClick}>
            COMPRAR
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
}

export default ProductDetails;

