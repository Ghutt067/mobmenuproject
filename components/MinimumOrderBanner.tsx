import { useMemo, useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { getAllProducts, type Product } from '../services/productService';
import { calculateProductTotalPrice } from '../utils/calculateProductPrice';
import { formatPrice } from '../utils/priceFormatter';
import './MinimumOrderBanner.css';

const MinimumOrderBanner: React.FC = () => {
  const { cartItems } = useCart();
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);

  // Carregar produtos
  useEffect(() => {
    const loadProducts = async () => {
      if (!store?.id) return;
      try {
        const loadedProducts = await getAllProducts(store.id);
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Erro ao carregar produtos para banner:', error);
      }
    };
    loadProducts();
  }, [store?.id]);

  const minimumOrderValue = store?.customizations?.minimumOrderValue ?? 0;

  // Calcular total do carrinho em centavos
  const cartTotalInCents = useMemo(() => {
    if (cartItems.length === 0) return 0;
    let totalInCents = 0;
    cartItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const itemTotalPrice = calculateProductTotalPrice(product, item.selectedOptions);
        totalInCents += itemTotalPrice * item.quantity;
      }
    });
    return totalInCents;
  }, [cartItems, products]);

  // Verificar se precisa mostrar a barrinha
  const shouldShow = minimumOrderValue > 0 && cartTotalInCents < minimumOrderValue && cartItems.length > 0;
  const remainingAmount = shouldShow ? minimumOrderValue - cartTotalInCents : 0;
  const remainingAmountInReais = remainingAmount / 100;
  
  // Calcular porcentagem do progresso
  const progressPercentage = minimumOrderValue > 0 
    ? Math.min((cartTotalInCents / minimumOrderValue) * 100, 100)
    : 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="minimum-order-banner">
      <div className="minimum-order-banner-content">
        <div className="minimum-order-banner-text-container">
          <span className="minimum-order-banner-text">
            Faltam <strong>{formatPrice(remainingAmountInReais.toFixed(2).replace('.', ','))}</strong> para atingir o pedido mínimo
          </span>
        </div>
        <div className="minimum-order-banner-progress-container">
          <div 
            className="minimum-order-banner-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MinimumOrderBanner;

