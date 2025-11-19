import { useEffect, useRef, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getAllProducts, type Product } from '../services/productService';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import CartBottomModal from '../components/CartBottomModal';
import '../App.css';

function Home() {
  const mainContentRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { searchTerm, isSearchOpen } = useSearch();
  const { hasItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hasRestoredScroll = useRef(false);

  // Detectar se é refresh/reload ou navegação interna
  useEffect(() => {
    // Resetar flag de restauração quando entrar na Home
    hasRestoredScroll.current = false;
    
    // Verificar se é um refresh (não há flag de navegação ativa)
    const isNavigationActive = sessionStorage.getItem('navigationActive');
    
    if (!isNavigationActive) {
      // É um refresh/reload - limpar posição e começar do topo
      sessionStorage.removeItem('homeScrollPosition');
      window.scrollTo({ top: 0, behavior: 'auto' });
      hasRestoredScroll.current = true;
    }
    
    // Marcar que a navegação está ativa (para próximas navegações)
    sessionStorage.setItem('navigationActive', 'true');
    
    // Cleanup: remover flag quando a página for fechada
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('navigationActive');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  // Buscar produtos do banco de dados com priorização
  useEffect(() => {
    let isMounted = true;
    
    const fetchProducts = async () => {
      try {
        // Não mostrar loading visível - carregar silenciosamente
        const data = await getAllProducts();
        
        // Verificar se o componente ainda está montado antes de atualizar
        if (isMounted) {
          setProducts(data);
          // Marcar como carregado após um pequeno delay para garantir renderização
          requestAnimationFrame(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Em caso de erro, mantém o array vazio para não quebrar a aplicação
        if (isMounted) {
          setProducts([]);
          setIsLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Salvar posição de scroll em tempo real enquanto está na Home
  useEffect(() => {
    if (location.pathname !== '/') return;

    const saveScrollPosition = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      if (scrollPosition > 0) {
        sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
      }
    };

    // Salvar periodicamente enquanto o usuário rola
    const scrollTimer = setInterval(saveScrollPosition, 500);

    // Salvar quando o componente for desmontado (navegação para outra rota)
    return () => {
      clearInterval(scrollTimer);
      // Salvar posição final quando sair da Home
      const finalScrollPosition = window.scrollY || document.documentElement.scrollTop;
      if (finalScrollPosition > 0) {
        sessionStorage.setItem('homeScrollPosition', finalScrollPosition.toString());
      }
    };
  }, [location.pathname]);

  // Controlar animação do modal
  useEffect(() => {
    if (hasItems()) {
      setIsExiting(false);
      setShowModal(true);
    } else if (showModal) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShowModal(false);
        setIsExiting(false);
      }, 300); // Duração da animação de saída
      return () => clearTimeout(timer);
    }
  }, [hasItems(), showModal]);

  // Restaurar posição de scroll quando voltar para a Home (navegação interna)
  useEffect(() => {
    // Só restaurar se:
    // 1. Estivermos na Home
    // 2. Não estiver carregando
    // 3. Não tiver restaurado ainda nesta montagem
    // 4. Não for um refresh (navigationActive existe)
    if (
      location.pathname === '/' && 
      !isLoading && 
      !hasRestoredScroll.current &&
      sessionStorage.getItem('navigationActive')
    ) {
      const savedScrollPosition = sessionStorage.getItem('homeScrollPosition');
      if (savedScrollPosition) {
        const scrollPos = parseInt(savedScrollPosition, 10);
        if (scrollPos > 0) {
          // Função para restaurar scroll
          const restoreScroll = () => {
            window.scrollTo({
              top: scrollPos,
              behavior: 'auto'
            });
            // Limpar a posição salva após restaurar
            sessionStorage.removeItem('homeScrollPosition');
            hasRestoredScroll.current = true;
          };

          // Aguardar múltiplos frames e um pequeno delay para garantir renderização completa
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                restoreScroll();
              }, 100);
            });
          });
        } else {
          hasRestoredScroll.current = true;
        }
      } else {
        hasRestoredScroll.current = true;
      }
    }
  }, [location.pathname, isLoading]);

  // Filtrar produtos baseado no termo de busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const searchUpper = searchTerm.toUpperCase();
    return products.filter((product) => {
      const titleMatch = product.title.toUpperCase().indexOf(searchUpper) > -1;
      const desc1Match = product.description1.toUpperCase().indexOf(searchUpper) > -1;
      const desc2Match = product.description2.toUpperCase().indexOf(searchUpper) > -1;
      
      return titleMatch || desc1Match || desc2Match;
    });
  }, [searchTerm, products]);

  return (
    <>
      <main className={`main-content ${showModal ? 'with-cart-modal' : ''}`} ref={mainContentRef}>
          {!isSearchOpen && <h2 className="section-title">OS MAIS PEDIDOS:</h2>}
          
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  image={product.image}
                  title={product.title}
                  description1={product.description1}
                  description2={product.description2}
                  oldPrice={product.oldPrice}
                  newPrice={product.newPrice}
                  fullDescription={product.fullDescription}
                  hasDiscount={product.hasDiscount}
                  priority={index < 6} // Primeiros 6 produtos carregam imediatamente (visíveis na tela)
                />
              ))
            ) : !isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#4A2C1A' }}>
                <p>Nenhum produto encontrado para "{searchTerm}"</p>
              </div>
            ) : null}
          </div>
      </main>
      {showModal && <CartBottomModal isExiting={isExiting} />}
    </>
  );
}

export default Home;

