import { useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getAllProducts, getProductsGrouped, type Product, type Set } from '../services/productService';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import CartBottomModal from '../components/CartBottomModal';
import '../App.css';

interface HomeProps {
  previewMode?: boolean;
}

function Home({ previewMode = false }: HomeProps) {
  const mainContentRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { searchTerm, isSearchOpen } = useSearch();
  const { hasItems } = useCart();
  const { store, loading: storeLoading } = useStore();
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
    // Em modo preview, não usar restoring-scroll
    if (previewMode) {
      setScrollRestored(true);
      return;
    }
    
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
    console.log('🔍 [Home] Verificando loja para carregar produtos', { 
      hasStore: !!store, 
      storeId: store?.id,
      storeName: store?.name,
      loading: storeLoading 
    });
    
    // Não carregar se não houver store (aguardar store estar disponível)
    if (!store?.id) {
      if (storeLoading) {
        console.log('⏳ [Home] Aguardando loja carregar...');
        setIsLoading(true);
      } else {
        console.warn('⚠️ [Home] Nenhuma loja disponível. Produtos não serão carregados.');
        console.warn('⚠️ [Home] Para carregar produtos, acesse com ?store=slug na URL');
        setIsLoading(false);
        setProducts([]);
        setProductSets([]);
      }
      return;
    }
    
    let isMounted = true;
    setIsLoading(true);
    
    const fetchProducts = async () => {
      try {
        console.log('🚀 [Home] Iniciando busca de produtos para loja:', store.id);
        
        // Buscar produtos agrupados por sets (filtrado por loja)
        // Forçar refresh se estiver em modo preview (página de personalização)
        const sets = await getProductsGrouped(store.id, previewMode);
        
        // Verificar se o componente ainda está montado antes de atualizar
        if (isMounted) {
          if (sets.length > 0) {
            console.log('✅ [Home] Produtos agrupados encontrados:', sets.length, 'sets');
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
            
            // IMPORTANTE: Buscar TODOS os produtos da loja para garantir que produtos em destaque
            // que não estão em sets também sejam incluídos
            const allStoreProducts = await getAllProducts(store.id);
            
            // Criar um mapa dos produtos já incluídos para evitar duplicatas
            const includedProductIds = new Set(allProducts.map(p => p.id));
            
            // Adicionar produtos que não estão em sets (incluindo produtos em destaque)
            allStoreProducts.forEach(product => {
              if (!includedProductIds.has(product.id)) {
                allProducts.push(product);
                includedProductIds.add(product.id);
              }
            });
            
            setProducts(allProducts);
            console.log('✅ [Home] Total de produtos carregados:', allProducts.length, '(incluindo produtos fora de sets)');
          } else {
            console.log('⚠️ [Home] Nenhum set encontrado, tentando getAllProducts...');
            // Se não há sets, usar getAllProducts como fallback (filtrado por loja)
            const data = await getAllProducts(store.id);
            setProducts(data);
            setProductSets([]);
            console.log('✅ [Home] Produtos carregados (fallback):', data.length);
          }
          
          // Marcar como carregado após um pequeno delay para garantir renderização
          requestAnimationFrame(() => {
            if (isMounted) {
              setIsLoading(false);
              console.log('✅ [Home] Carregamento concluído');
            }
          });
        }
      } catch (error) {
        console.error('❌ [Home] Erro ao carregar produtos:', error);
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
  }, [store?.id, storeLoading, previewMode]);

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

  // Função para gerar ID único para uma seção
  const getSectionId = (setId: string | number, setName: string) => {
    // Sanitizar o nome removendo caracteres especiais e espaços
    const sanitizedName = setName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `section-${setId}-${sanitizedName}`;
  };

  // Função para verificar se uma seção já está visível no topo
  const isSectionVisible = (sectionId: string): boolean => {
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) return false;

    // Buscar o título da seção (h2) dentro do elemento
    const titleElement = sectionElement.querySelector('h2.section-title');
    const targetElement = titleElement || sectionElement;

    const rect = targetElement.getBoundingClientRect();
    
    // Verificar se o topo do título está visível (com uma pequena margem de tolerância)
    // Considera visível se o topo do título está entre -50px e 100px da viewport
    // Isso permite uma margem maior para considerar o header fixo
    return rect.top >= -50 && rect.top <= 100;
  };

  // Função para rolar até uma seção
  const scrollToSection = (sectionId: string) => {
    // Aguardar um pouco para garantir que o DOM está atualizado
    setTimeout(() => {
      let sectionElement = document.getElementById(sectionId);
      
      // Se não encontrou, tentar encontrar por querySelector
      if (!sectionElement) {
        sectionElement = document.querySelector(`[id="${sectionId}"]`) as HTMLElement;
      }
      
      if (!sectionElement) {
        console.warn('Seção não encontrada:', sectionId);
        return;
      }

      // Buscar o título da seção (h2) dentro do elemento
      const titleElement = sectionElement.querySelector('h2.section-title') as HTMLElement;
      const targetElement = titleElement || sectionElement;

      if (!targetElement) {
        return;
      }

      // Verificar se a seção já está visível (com margem maior)
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Se o topo do elemento está entre -50px e 100px da viewport, considera visível
      if (rect.top >= -50 && rect.top <= 100) {
        // Seção já está visível, não rolar
        return;
      }

      // Calcular altura do header fixo (se existir)
      const fixedHeader = document.querySelector('.fixed-header') as HTMLElement;
      let headerHeight = 0;
      if (fixedHeader && window.innerWidth < 768) {
        headerHeight = fixedHeader.offsetHeight || 0;
      }

      // Calcular a posição absoluta do elemento usando getBoundingClientRect
      const elementTop = rect.top + scrollTop;

      // Rolar suavemente até a seção, considerando o header fixo
      const targetScroll = elementTop - headerHeight - 20; // Offset para não colar no topo

      // Forçar scroll mesmo que seja 0 para garantir que funcione
      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }, 100); // Pequeno delay para garantir que o DOM está atualizado
  };

  // Refs para o carrossel de produtos em destaque
  const featuredCarouselRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Efeito para criar scroll infinito no carrossel
  useEffect(() => {
    const carousel = featuredCarouselRef.current;
    const featuredProductIds = store?.customizations?.featuredProductIds || [];
    
    if (!carousel || featuredProductIds.length === 0 || searchTerm.trim()) return;

    let isResetting = false;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!carousel || isResetting) return;
      
      const scrollLeft = carousel.scrollLeft;
      const scrollWidth = carousel.scrollWidth;
      
      if (scrollWidth === 0) return; // Ainda não calculado
      
      const oneSetWidth = scrollWidth / 3;
      
      if (oneSetWidth === 0) return; // Ainda não calculado

      // Se chegou perto do final (terceira cópia), voltar para a posição equivalente na segunda cópia
      if (scrollLeft >= oneSetWidth * 2 - 200) {
        isResetting = true;
        const offset = scrollLeft - (oneSetWidth * 2);
        const newScrollLeft = oneSetWidth + offset;
        carousel.scrollLeft = newScrollLeft;
        
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          isResetting = false;
          rafId = null;
        });
      }
      // Se voltou para antes do início (primeira cópia), ir para a posição equivalente na segunda cópia
      else if (scrollLeft <= 200) {
        isResetting = true;
        const newScrollLeft = oneSetWidth + scrollLeft;
        carousel.scrollLeft = newScrollLeft;
        
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          isResetting = false;
          rafId = null;
        });
      }
    };

    // Aguardar múltiplos frames para garantir que o DOM está totalmente renderizado
    const initCarousel = () => {
      if (carousel && carousel.scrollWidth > 0) {
        const oneSetWidth = carousel.scrollWidth / 3;
        if (oneSetWidth > 0) {
          carousel.scrollLeft = oneSetWidth;
        } else {
          // Se ainda não calculou, tentar novamente
          requestAnimationFrame(initCarousel);
        }
      } else {
        requestAnimationFrame(initCarousel);
      }
    };

    // Inicializar após um pequeno delay para garantir que os produtos foram renderizados
    setTimeout(() => {
      initCarousel();
    }, 100);

    carousel.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [store?.customizations?.featuredProductIds, searchTerm, products.length]);

  // Renderizar produtos em destaque
  const renderFeaturedProducts = () => {
    const featuredProductIds = store?.customizations?.featuredProductIds || [];
    
    if (featuredProductIds.length === 0 || searchTerm.trim()) {
      return null;
    }

    // Buscar produtos em destaque na ordem especificada
    const featuredProducts = featuredProductIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);

    if (featuredProducts.length === 0) {
      return null;
    }

    // Duplicar produtos para criar efeito de loop infinito
    const duplicatedProducts = [...featuredProducts, ...featuredProducts, ...featuredProducts];

    return (
      <div className="featured-products-section" style={{ marginBottom: '32px' }}>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Produtos em Destaque</h2>
        <div className="featured-products-carousel-wrapper">
          <div 
            className="featured-products-carousel" 
            ref={featuredCarouselRef}
            onMouseDown={(e) => {
              // Não iniciar scroll drag se clicar em botão
              const target = e.target as HTMLElement;
              if (target.closest('button')) {
                return;
              }
              
              if (!featuredCarouselRef.current) return;
              
              isMouseDownRef.current = true;
              dragStartXRef.current = e.clientX;
              isDraggingRef.current = false;
              hasDraggedRef.current = false;
              startXRef.current = e.pageX - featuredCarouselRef.current.offsetLeft;
              scrollLeftRef.current = featuredCarouselRef.current.scrollLeft;
            }}
            onMouseLeave={() => {
              if (!featuredCarouselRef.current) return;
              
              // Restaurar pointer-events dos cards
              const cards = featuredCarouselRef.current.querySelectorAll('.product-card');
              cards.forEach(card => {
                (card as HTMLElement).style.pointerEvents = '';
              });
              
              isMouseDownRef.current = false;
              isDraggingRef.current = false;
              hasDraggedRef.current = false;
              featuredCarouselRef.current.style.cursor = 'grab';
              featuredCarouselRef.current.style.userSelect = 'auto';
            }}
            onMouseUp={(e) => {
              if (!featuredCarouselRef.current) return;
              
              // Se houve arrasto, prevenir cliques
              if (hasDraggedRef.current) {
                e.preventDefault();
                e.stopPropagation();
                
                // Restaurar pointer-events dos cards após um pequeno delay
                setTimeout(() => {
                  const cards = featuredCarouselRef.current?.querySelectorAll('.product-card');
                  cards?.forEach(card => {
                    (card as HTMLElement).style.pointerEvents = '';
                  });
                }, 100);
              }
              
              // Atualizar scrollLeftRef com a posição final
              scrollLeftRef.current = featuredCarouselRef.current.scrollLeft;
              
              isMouseDownRef.current = false;
              isDraggingRef.current = false;
              hasDraggedRef.current = false;
              featuredCarouselRef.current.style.cursor = 'grab';
              featuredCarouselRef.current.style.userSelect = 'auto';
            }}
            onMouseMove={(e) => {
              if (!featuredCarouselRef.current || !isMouseDownRef.current) return;
              
              // Só ativa drag se o mouse estiver pressionado E houver movimento significativo
              if (!isDraggingRef.current) {
                const moveDistance = Math.abs(e.clientX - dragStartXRef.current);
                // Só ativa drag se moveu mais de 10px
                if (moveDistance > 10) {
                  isDraggingRef.current = true;
                  hasDraggedRef.current = true;
                  featuredCarouselRef.current.style.cursor = 'grabbing';
                  featuredCarouselRef.current.style.userSelect = 'none';
                  
                  // Prevenir cliques nos cards durante arrasto
                  const cards = featuredCarouselRef.current.querySelectorAll('.product-card');
                  cards.forEach(card => {
                    (card as HTMLElement).style.pointerEvents = 'none';
                  });
                }
              }
              
              // Só faz scroll se realmente estiver em modo drag
              if (isDraggingRef.current) {
                e.preventDefault();
                e.stopPropagation();
                const x = e.pageX - featuredCarouselRef.current.offsetLeft;
                const walk = (x - startXRef.current) * 1.2; // Velocidade do scroll
                let newScrollLeft = scrollLeftRef.current - walk;
                
                // Verificar e resetar loop infinito durante arrasto
                const scrollWidth = featuredCarouselRef.current.scrollWidth;
                if (scrollWidth > 0) {
                  const oneSetWidth = scrollWidth / 3;
                  
                  // Se chegou perto do final (terceira cópia), voltar para a segunda cópia
                  if (newScrollLeft >= oneSetWidth * 2 - 200) {
                    const offset = newScrollLeft - (oneSetWidth * 2);
                    newScrollLeft = oneSetWidth + offset;
                    scrollLeftRef.current = newScrollLeft;
                    startXRef.current = e.pageX - featuredCarouselRef.current.offsetLeft;
                  }
                  // Se voltou para antes do início (primeira cópia), ir para a segunda cópia
                  else if (newScrollLeft <= 200) {
                    newScrollLeft = oneSetWidth + newScrollLeft;
                    scrollLeftRef.current = newScrollLeft;
                    startXRef.current = e.pageX - featuredCarouselRef.current.offsetLeft;
                  }
                }
                
                featuredCarouselRef.current.scrollLeft = newScrollLeft;
              }
            }}
          >
            {duplicatedProducts.map((product, index) => (
              <ProductCard
                key={`${product.id}-${index}`}
                productId={product.id}
                image={product.image}
                title={product.title}
                description1={product.description1}
                description2={product.description2}
                oldPrice={product.oldPrice}
                newPrice={product.newPrice}
                fullDescription={product.fullDescription}
                hasDiscount={product.hasDiscount}
                priority={index < 6} // Primeiros 6 produtos carregam imediatamente
                previewMode={previewMode}
                optionGroups={product.optionGroups}
                hideDescription={true}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar barra de navegação de seções
  const renderSectionNavigation = () => {
    // Não mostrar navegação se há busca ativa ou se não há sets
    if (searchTerm.trim() || filteredSets.length === 0) {
      return null;
    }

    return (
      <div className="sections-navigation" style={{ backgroundColor: '#e5e5e5' }}>
        {filteredSets.map((set) => {
          const sectionId = getSectionId(set.id, set.name);
          return (
            <button
              key={set.id}
              className="section-nav-button"
              onClick={() => scrollToSection(sectionId)}
            >
              {set.name}
            </button>
          );
        })}
      </div>
    );
  };

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
                previewMode={previewMode}
                optionGroups={product.optionGroups}
              />
            ))
          ) : !isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--store-text-color, #4A2C1A)', margin: 0 }}>Nenhum produto encontrado para "{searchTerm}"</p>
            </div>
          ) : null}
        </div>
      );
    }

    // Se há sets organizados, renderizar cada set como uma seção
    if (filteredSets.length > 0) {
      let globalProductIndex = 0;
      console.log('Home: Renderizando sets:', filteredSets.length, filteredSets.map(s => ({ name: s.name, products: s.products?.length || 0, subsets: s.subsets?.length || 0 })));
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

        const sectionStartIndex = globalProductIndex;
        globalProductIndex += setProducts.length;

        const sectionId = getSectionId(set.id, set.name);
        return (
          <div key={set.id} id={sectionId} className="product-section">
            {!isSearchOpen && <h2 className="section-title">{set.name}</h2>}
            <div className="products-grid">
              {setProducts.length > 0 ? (
                setProducts.map((product, index) => (
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
                    previewMode={previewMode}
                    optionGroups={product.optionGroups}
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--store-text-color, #4A2C1A)' }}>
                  <p>Nenhum produto nesta seção ainda</p>
                </div>
              )}
            </div>
          </div>
        );
      });
    }

    // Fallback: se não há sets, mostrar todos os produtos na seção "OS MAIS PEDIDOS"
    const fallbackSectionId = getSectionId('fallback', 'OS MAIS PEDIDOS');
    return (
      <>
        {!isSearchOpen && <h2 id={fallbackSectionId} className="section-title">OS MAIS PEDIDOS</h2>}
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
                previewMode={previewMode}
                optionGroups={product.optionGroups}
                />
              ))
            ) : !isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--store-text-color, #4A2C1A)', margin: 0 }}>Nenhum produto encontrado para "{searchTerm}"</p>
              </div>
            ) : null}
          </div>
      </>
    );
  };

  // Em modo preview, não usar restoring-scroll para não esconder conteúdo
  const shouldHideContent = !previewMode && !scrollRestored;
  
  // Verificar se há slug na URL atual
  const pathMatch = location.pathname.match(/^\/([^\/]+)/);
  const urlSlug = pathMatch ? pathMatch[1] : null;
  const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
  const hasSlugInUrl = urlSlug && !specialRoutes.includes(urlSlug);
  
  // Se há slug na URL, verificar se a loja carregada corresponde
  const storeMatchesUrl = !hasSlugInUrl || (store?.slug === urlSlug);
  
  // NÃO RENDERIZAR NADA até:
  // 1. A loja não estiver carregando
  // 2. Se há slug na URL, a loja carregada deve corresponder
  // 3. Se não há slug na URL, pode mostrar (página raiz)
  if (storeLoading || (hasSlugInUrl && (!store || store.slug !== urlSlug))) {
    return (
      <main className="main-content" ref={mainContentRef} style={{ opacity: 0, pointerEvents: 'none' }}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <p>Carregando...</p>
        </div>
      </main>
    );
  }
  
  return (
    <>
      <main 
        className={`main-content ${showModal ? 'with-cart-modal' : ''} ${shouldHideContent ? 'restoring-scroll' : ''}`} 
        ref={mainContentRef}
      >
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--store-text-color, #4A2C1A)' }}>
            <p>Carregando produtos...</p>
          </div>
        ) : (
          <>
            {renderFeaturedProducts()}
            {renderSectionNavigation()}
            {renderSections()}
          </>
        )}
      </main>
      {showModal && <CartBottomModal isExiting={isExiting} />}
    </>
  );
}

export default Home;

