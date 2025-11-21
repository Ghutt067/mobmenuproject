import { useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getAllProducts, getProductsGrouped, type Product, type Set } from '../services/productService';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import CartBottomModal from '../components/CartBottomModal';
import '../App.css';

function Home() {
  const mainContentRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { searchTerm, isSearchOpen } = useSearch();
  const { hasItems } = useCart();
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [productSets, setProductSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);
  const hasRestoredScroll = useRef(false);

  // Desabilitar scroll automático do browser e garantir topo na primeira carga
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // PRIMEIRA CARGA: Se não há flag de navegação ativa, garantir que está no topo
    // Isso previne que posições salvas antigas ou comportamento do browser causem scroll inicial
    const isNavigationActive = sessionStorage.getItem('navigationActive');
    if (!isNavigationActive) {
      // Forçar scroll para o topo imediatamente na primeira carga
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    
    // Cleanup: remover flag quando a página for fechada
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('navigationActive');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Restaurar scroll ANTES da pintura do browser (useLayoutEffect executa de forma síncrona)
  useLayoutEffect(() => {
    // Resetar flag de restauração quando entrar na Home - manter conteúdo oculto
    hasRestoredScroll.current = false;
    setScrollRestored(false);
    
    // Verificar se é um refresh ou primeira carga
    const isNavigationActive = sessionStorage.getItem('navigationActive');
    const savedScrollPosition = sessionStorage.getItem('homeScrollPosition');
    
    // PRIMEIRA CARGA: Se não há flag de navegação ativa, é refresh/reload ou primeira visita
    // Neste caso, SEMPRE ir para o topo (limpar qualquer posição salva antiga)
    if (!isNavigationActive) {
      // Limpar posição salva se existir (pode ser de sessão anterior que ficou no storage)
      if (savedScrollPosition) {
        sessionStorage.removeItem('homeScrollPosition');
      }
      // Ir para o topo de forma síncrona
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      hasRestoredScroll.current = true;
      // Mostrar conteúdo imediatamente na primeira carga
      setScrollRestored(true);
    } else if (savedScrollPosition) {
      // NAVEGAÇÃO INTERNA: Há flag de navegação ativa E posição salva
      // Restaurar scroll ANTES de mostrar o conteúdo
      const scrollPos = parseInt(savedScrollPosition, 10);
      
      if (!isNaN(scrollPos) && scrollPos > 0) {
        // Restaurar scroll de forma síncrona, antes de qualquer pintura
        document.documentElement.scrollTop = scrollPos;
        document.body.scrollTop = scrollPos;
        window.scrollTo(0, scrollPos);
        hasRestoredScroll.current = true;
        
        // Aguardar que o scroll seja realmente aplicado ANTES de mostrar o conteúdo
        // Usar múltiplos requestAnimationFrame para garantir
        requestAnimationFrame(() => {
          // Forçar scroll novamente para garantir
          document.documentElement.scrollTop = scrollPos;
          document.body.scrollTop = scrollPos;
          window.scrollTo(0, scrollPos);
          
          requestAnimationFrame(() => {
            // Verificar se o scroll foi aplicado corretamente
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            if (Math.abs(currentScroll - scrollPos) < 10) {
              // Scroll foi aplicado - mostrar conteúdo
              setScrollRestored(true);
            } else {
              // Ainda não foi aplicado - forçar mais uma vez e aguardar
              document.documentElement.scrollTop = scrollPos;
              document.body.scrollTop = scrollPos;
              window.scrollTo(0, scrollPos);
              // Aguardar um pouco mais e mostrar
              setTimeout(() => {
                setScrollRestored(true);
              }, 50);
            }
          });
        });
      } else {
        // Posição inválida - ir para o topo
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
        setScrollRestored(true);
      }
    } else {
      // Navegação ativa mas sem posição salva - ir para o topo
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      setScrollRestored(true);
    }
    
    // Marcar que a navegação está ativa APENAS após o primeiro carregamento
    // Isso garante que na próxima vez que voltar de outra página, a flag já exista
    if (!isNavigationActive) {
      // Primeira vez - marcar que agora a navegação está ativa (para próximas navegações)
      sessionStorage.setItem('navigationActive', 'true');
    }
  }, [location.pathname]);

  // Buscar produtos do banco de dados com priorização
  useEffect(() => {
    let isMounted = true;
    
    const fetchProducts = async () => {
      try {
        // Buscar produtos agrupados por sets (filtrado por loja)
        const sets = await getProductsGrouped(store?.id);
        
        // Verificar se o componente ainda está montado antes de atualizar
        if (isMounted) {
          if (sets.length > 0) {
            // Se há sets, usar a estrutura agrupada
            setProductSets(sets);
            // Também manter produtos para compatibilidade com busca
            const allProducts: Product[] = [];
            sets.forEach(set => {
              if (set.products) {
                allProducts.push(...set.products);
              }
              if (set.subsets) {
                set.subsets.forEach(subset => {
                  if (subset.products) {
                    allProducts.push(...subset.products);
                  }
                });
              }
            });
            setProducts(allProducts);
          } else {
            // Se não há sets, usar getAllProducts como fallback (filtrado por loja)
            const data = await getAllProducts(store?.id);
            setProducts(data);
            setProductSets([]);
          }
          
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
          setProductSets([]);
          setIsLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Salvar posição de scroll com debounce otimizado
  useEffect(() => {
    if (location.pathname !== '/') return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    let lastSavedPosition = 0;

    const saveScrollPosition = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      // Só salvar se mudou significativamente (mais de 50px) para reduzir I/O
      if (Math.abs(scrollPosition - lastSavedPosition) > 50 && scrollPosition > 0) {
        sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
        lastSavedPosition = scrollPosition;
      }
    };

    // Debounce: salvar apenas após 200ms sem scroll (reduz chamadas drasticamente)
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 200);
    };

    // Salvar também quando parar de rolar (usando requestIdleCallback se disponível)
    const handleScrollEnd = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(saveScrollPosition, { timeout: 500 });
      } else {
        setTimeout(saveScrollPosition, 300);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScrollEnd, { passive: true, once: false });

    // Salvar quando o componente for desmontado (navegação para outra rota)
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScrollEnd);
      // Salvar posição final quando sair da Home
      const finalScrollPosition = window.scrollY || document.documentElement.scrollTop;
      if (finalScrollPosition > 0) {
        sessionStorage.setItem('homeScrollPosition', finalScrollPosition.toString());
      }
    };
  }, [location.pathname]);

  // Controlar animação do modal
  useEffect(() => {
    // Não mostrar modal se está vindo de "CONTINUAR COMPRA" - só mostrar depois que chegar no checkout
    const comingFromContinuePurchase = sessionStorage.getItem('comingFromContinuePurchase');
    if (comingFromContinuePurchase === 'true') {
      // Aguardar navegação completar - não mostrar modal ainda
      return;
    }
    
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

  // Ajuste fino da posição de scroll após renderização completa (só se necessário)
  useEffect(() => {
    if (
      location.pathname === '/' && 
      !isLoading && 
      scrollRestored &&
      sessionStorage.getItem('navigationActive')
    ) {
      const savedScrollPosition = sessionStorage.getItem('homeScrollPosition');
      if (savedScrollPosition) {
        const scrollPos = parseInt(savedScrollPosition, 10);
        if (!isNaN(scrollPos) && scrollPos > 0) {
          // Ajuste fino após o conteúdo estar renderizado e visível
          const adjustScroll = () => {
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            // Se a diferença for maior que 5px, ajustar
            if (Math.abs(currentScroll - scrollPos) > 5) {
              document.documentElement.scrollTop = scrollPos;
              document.body.scrollTop = scrollPos;
              window.scrollTo(0, scrollPos);
            }
          };
          
          // Aguardar um pouco para o conteúdo estar totalmente renderizado
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              adjustScroll();
            });
          });
        }
      }
    }
  }, [location.pathname, isLoading, scrollRestored]);

  // Filtrar produtos baseado no termo de busca - otimizado
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const searchUpper = searchTerm.toUpperCase().trim();
    // Usar includes ao invés de indexOf para melhor performance
    return products.filter((product) => {
      return (
        product.title.toUpperCase().includes(searchUpper) ||
        product.description1.toUpperCase().includes(searchUpper) ||
        product.description2.toUpperCase().includes(searchUpper) ||
        (product.fullDescription?.toUpperCase().includes(searchUpper) ?? false)
      );
    });
  }, [searchTerm, products]);

  // Filtrar sets baseado no termo de busca
  const filteredSets = useMemo(() => {
    if (!searchTerm.trim()) {
      return productSets;
    }

    // Se há busca, retornar sets vazios e mostrar apenas produtos filtrados
    return [];
  }, [searchTerm, productSets]);

  // Renderizar seções de produtos
  const renderSections = () => {
    // Se há busca ativa, mostrar apenas produtos filtrados sem seções
    if (searchTerm.trim()) {
  return (
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
                priority={index < 6}
              />
            ))
          ) : !isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#4A2C1A' }}>
              <p>Nenhum produto encontrado para "{searchTerm}"</p>
            </div>
          ) : null}
        </div>
      );
    }

    // Se há sets organizados, renderizar cada set como uma seção
    if (filteredSets.length > 0) {
      let globalProductIndex = 0;
      return filteredSets.map((set) => {
        const setProducts: Product[] = [];
        
        // Coletar produtos do set
        if (set.products) {
          setProducts.push(...set.products);
        }
        
        // Coletar produtos dos subsets
        if (set.subsets) {
          set.subsets.forEach(subset => {
            if (subset.products) {
              setProducts.push(...subset.products);
            }
          });
        }

        if (setProducts.length === 0) return null;

        const sectionStartIndex = globalProductIndex;
        globalProductIndex += setProducts.length;

        return (
          <div key={set.id} className="product-section">
            {!isSearchOpen && <h2 className="section-title">{set.name}:</h2>}
            <div className="products-grid">
              {setProducts.map((product, index) => (
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
                  priority={sectionStartIndex + index < 6} // Primeiros 6 produtos carregam imediatamente
                />
              ))}
            </div>
          </div>
        );
      });
    }

    // Fallback: se não há sets, mostrar todos os produtos na seção "OS MAIS PEDIDOS"
    return (
      <>
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
      </>
    );
  };

  return (
    <>
      <main 
        className={`main-content ${showModal ? 'with-cart-modal' : ''} ${!scrollRestored ? 'restoring-scroll' : ''}`} 
        ref={mainContentRef}
      >
        {renderSections()}
      </main>
      {showModal && <CartBottomModal isExiting={isExiting} />}
    </>
  );
}

export default Home;

