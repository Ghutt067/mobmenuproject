import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import { getAllProducts, clearProductsCache, type Product } from '../services/productService';
import { getProductImage } from '../utils/imageHelper';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import { formatPrice } from '../utils/priceFormatter';
import { formatProductTotalPrice, calculateAdditionalPrice, hasProductBasePrice } from '../utils/calculateProductPrice';
import AddToCartPopup from '../components/AddToCartPopup';
import ProductOptions from '../components/ProductOptions';
import type { SelectedOptions } from '../types/productOptions';
import backIcon from '../icons/backicon.svg';
import './ProductDetails.css';

function ProductDetails() {
  const { navigate } = useStoreNavigation();
  const { store } = useStore();
  const routerNavigate = useRouterNavigate();
  const location = useLocation();
  const { productId } = useParams<{ productId: string }>();
  const { addToCart, hasItems, getItemQuantity } = useCart();
  // Verificar se veio do checkout (modal "Peça também")
  const fromCheckout = (location.state as { fromCheckout?: boolean })?.fromCheckout || false;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showFixedButton, setShowFixedButton] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  // Garantir que a página sempre abre no topo
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        // Limpar cache para garantir que busca as opções atualizadas
        clearProductsCache();
        // Passar storeId para garantir que as opções sejam carregadas corretamente
        const products = await getAllProducts(store?.id);
        const foundProduct = products.find(p => p.id === productId);
        
        if (foundProduct) {
          console.log('📦 [ProductDetails] Produto encontrado:', {
            id: foundProduct.id,
            title: foundProduct.title,
            optionGroupsCount: foundProduct.optionGroups?.length || 0,
            optionGroups: foundProduct.optionGroups,
          });
          
          // Log detalhado das opções
          if (foundProduct.optionGroups && foundProduct.optionGroups.length > 0) {
            console.log('✅ [ProductDetails] Opções encontradas:', {
              grupos: foundProduct.optionGroups.map(g => ({
                id: g.id,
                title: g.title,
                type: g.type,
                optionsCount: g.options?.length || 0,
                options: g.options
              }))
            });
          } else {
            console.warn('⚠️ [ProductDetails] Produto não tem opções ou opções vazias');
          }
        } else {
          console.warn('⚠️ [ProductDetails] Produto não encontrado:', productId);
        }
        
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
  }, [productId, store?.id]);

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
    // Voltar para a página anterior no histórico do navegador usando o navigate do react-router-dom
    routerNavigate(-1);
  };

  const validateOptions = (): boolean => {
    if (!product) return false;

    // Verificar se o produto tem preço base
    const normalizePrice = (price: string): number => {
      return Math.round(
        parseFloat(
          price
            .replace(/R\$\s*/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
        ) * 100
      ) || 0;
    };

    const productBasePrice = normalizePrice(product.newPrice);
    const hasBasePrice = productBasePrice > 0;

    // Se o produto não tem preço base, é obrigatório ter opções e selecionar pelo menos uma
    if (!hasBasePrice) {
      if (!product.optionGroups || product.optionGroups.length === 0) {
        return false; // Produto sem preço base precisa ter opções
      }

      // Verificar se pelo menos uma opção foi selecionada
      let hasAnySelection = false;
      for (const group of product.optionGroups) {
        const selections = selectedOptions[group.id] || [];
        if (selections.length > 0) {
          hasAnySelection = true;
          break;
        }
      }

      if (!hasAnySelection) {
        return false; // Precisa selecionar pelo menos uma opção
      }
    }

    // Se não tem opções, sempre válido (desde que tenha preço base)
    if (!product.optionGroups || product.optionGroups.length === 0) {
      return true;
    }

    // Verificar se todas as opções obrigatórias foram preenchidas
    for (const group of product.optionGroups) {
      if (!group.required) continue;

      const selections = selectedOptions[group.id] || [];
      const minSelections = group.minSelections || (group.type === 'single' ? 1 : 0);

      if (selections.length < minSelections) {
        return false;
      }
    }

    return true;
  };

  const handleBuyClick = () => {
    if (!product) return;

    // Validar opções antes de adicionar ao carrinho
    if (!validateOptions()) {
      const hasBasePrice = hasProductBasePrice(product);
      if (!hasBasePrice) {
        alert('Por favor, selecione pelo menos uma opção para continuar.');
      } else {
        alert('Por favor, complete todas as opções obrigatórias antes de continuar.');
      }
      return;
    }
    
    // Se veio do checkout, adiciona diretamente ao carrinho e volta
    if (fromCheckout) {
      addToCart(product.id, selectedOptions);
      routerNavigate(-1);
    } else if (hasItems()) {
      // Se há itens no carrinho (modo "adicionar"), adiciona diretamente
      addToCart(product.id, selectedOptions);
      // Voltar para a Home após adicionar
      sessionStorage.setItem('navigationActive', 'true');
      navigate('');
    } else {
      // Se não houver itens, mostra o popup
      setIsPopupOpen(true);
    }
  };

  const handleContinue = () => {
    if (!product) return;
    
    // Validar opções antes de continuar
    if (!validateOptions()) {
      const hasBasePrice = hasProductBasePrice(product);
      if (!hasBasePrice) {
        alert('Por favor, selecione pelo menos uma opção para continuar.');
      } else {
        alert('Por favor, complete todas as opções obrigatórias antes de continuar.');
      }
      return;
    }

    setIsPopupOpen(false);
    // Marcar que está vindo de "CONTINUAR COMPRA" - não ativar modal até chegar no checkout
    sessionStorage.setItem('comingFromContinuePurchase', 'true');
    sessionStorage.setItem('navigationActive', 'true');
    // Navegar imediatamente sem delay
    navigate(`/checkout/${product.id}`);
  };

  const handleAdd = () => {
    if (!product) return;
    
    // Validar opções antes de adicionar
    if (!validateOptions()) {
      const hasBasePrice = hasProductBasePrice(product);
      if (!hasBasePrice) {
        alert('Por favor, selecione pelo menos uma opção para continuar.');
      } else {
        alert('Por favor, complete todas as opções obrigatórias antes de continuar.');
      }
      return;
    }

    addToCart(product.id, selectedOptions);
    // Não fechar imediatamente - deixar o AddToCartPopup gerenciar o fechamento com animação
    // Voltar para a Home após adicionar (modo adicionar ao carrinho ativo)
    // A navegação será feita após o popup fechar (300ms de animação)
    sessionStorage.setItem('navigationActive', 'true');
    setTimeout(() => {
      navigate('/');
    }, 350); // Pequeno delay após a animação do popup
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

  const productImage = getProductImage(product.image);
  console.log('🖼️ [ProductDetails] Produto:', product.title, '| Imagem recebida:', product.image, '| Imagem final:', productImage);
  
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
            {(() => {
              const hasBasePrice = hasProductBasePrice(product);
              const additional = calculateAdditionalPrice(product, selectedOptions);

              // Se não tem preço base, mostrar apenas o preço das opções
              if (!hasBasePrice) {
                if (additional > 0) {
                  return (
                    <span className="product-details-price-new">
                      {formatProductTotalPrice(product, selectedOptions)}
                    </span>
                  );
                } else {
                  return (
                    <span className="product-details-price-new" style={{ color: '#999' }}>
                      Selecione uma opção para ver o preço
                    </span>
                  );
                }
              }

              // Se tem preço base, mostrar normalmente
              return (
                <>
                  {product.hasDiscount && product.oldPrice && product.oldPrice.trim() !== '' && product.oldPrice !== product.newPrice && (
                    <span className="product-details-price-old">{formatPrice(product.oldPrice)}</span>
                  )}
                  <span className="product-details-price-new">
                    {formatProductTotalPrice(product, selectedOptions)}
                  </span>
                  {additional > 0 && (
                    <span className="product-details-price-additional">
                      (+ {formatPrice((additional / 100).toFixed(2).replace('.', ','))} de opções)
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {(() => {
            const hasOptions = product.optionGroups && product.optionGroups.length > 0;
            console.log('🔍 [ProductDetails] Verificando renderização de opções:', {
              hasOptionGroups: !!product.optionGroups,
              optionGroupsLength: product.optionGroups?.length || 0,
              willRender: hasOptions,
              optionGroups: product.optionGroups
            });
            
            if (hasOptions) {
              return (
                <ProductOptions
                  optionGroups={product.optionGroups!}
                  onSelectionChange={setSelectedOptions}
                />
              );
            }
            
            return null;
          })()}

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
      {showFixedButton && (store?.customizations?.showFixedButton ?? true) && (
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

