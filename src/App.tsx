import { useEffect, useLayoutEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import PromoBanner from './components/PromoBanner';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Identification from './pages/Identification';
import ProductDetails from './pages/ProductDetails';
import { useSearch } from './contexts/SearchContext';
import { useStore } from './contexts/StoreContext';
import { useCart } from './contexts/CartContext';
import MinimumOrderBanner from './components/MinimumOrderBanner';
import RootRedirect from './components/RootRedirect';

// Páginas Admin
import AdminLogin from './pages/admin/Login';
import AdminRegister from './pages/admin/Register';
import AdminProducts from './pages/admin/Products';
import AdminSections from './pages/admin/Sections';
import AdminCustomization from './pages/admin/Customization';
import AdminPersonalization from './pages/admin/Personalization';
import AdminSettings from './pages/admin/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

import './App.css';

// Componente para redirecionar /admin baseado no estado de autenticação
function AdminRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Aguardar um pouco para verificar autenticação
    if (!loading) {
      if (user) {
        // Usar window.location.href para forçar reload completo
        window.location.href = '/admin/produtos';
      } else {
        // Usar window.location.href para forçar reload completo
        window.location.href = '/admin/login';
      }
    }
  }, [user, loading]);

  // Mostrar loading enquanto redireciona
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666',
    }}>
      Carregando...
    </div>
  );
}

function App() {
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isSearchOpen } = useSearch();
  const { store, loading: storeLoading } = useStore();
  const { cartItems } = useCart();
  
  // Aplicar valores padrão de cores imediatamente para evitar flash
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-primary-color', '#808080');
    root.style.setProperty('--store-secondary-color', '#2C3E50');
    root.style.setProperty('--store-background-color', '#FFFFFF');
    root.style.setProperty('--store-text-color', '#000000');
    root.style.setProperty('--store-promo-banner-bg-color', '#E8E8E8');
    root.style.setProperty('--store-menu-border-color', 'color-mix(in srgb, #FFFFFF 85%, black)');
    root.style.setProperty('--store-input-background-color', 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--store-icon-filter', 'brightness(0) saturate(100%)');
    root.style.setProperty('--store-primary-button-text', '#000000');
    root.style.setProperty('--store-secondary-button-text', '#000000');
    root.style.setProperty('--store-primary-button-icon-filter', 'brightness(0) saturate(100%)');
    root.style.setProperty('--store-secondary-button-icon-filter', 'brightness(0) saturate(100%)');
    root.style.setProperty('--store-readmore-link-color', '#16A34A');
    root.style.setProperty('--store-readmore-link-icon-filter', 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(95deg) brightness(98%) contrast(86%)');
  }, []);
  // Detectar rotas com ou sem slug da loja
  const isCheckoutPage = location.pathname.includes('/checkout') && !location.pathname.includes('/checkout/identification') && !location.pathname.includes('/sacola/identification') || location.pathname.includes('/sacola') && !location.pathname.includes('/sacola/identification') || location.pathname === '/cart';
  const isIdentificationPage = location.pathname.includes('/checkout/identification') || location.pathname.includes('/sacola/identification');
  const isProductDetailsPage = location.pathname.includes('/produto/') || location.pathname.includes('/product/');
  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Mostrar banner de pedido mínimo apenas em páginas da loja (não checkout, não admin)
  const showMinimumOrderBanner = !isCheckoutPage && !isAdminPage && cartItems.length > 0;

  // Função para calcular luminosidade relativa de uma cor (0-1)
  const getLuminance = (hex: string): number => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0.5;
    
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    
    // Fórmula de luminosidade relativa (WCAG)
    const [rs, gs, bs] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Função para calcular filtro CSS que coloriza SVG com uma cor específica
  // Usa a fórmula mais precisa para converter RGB para filtros CSS
  const getIconFilter = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'brightness(0) saturate(100%)';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    // Calcular luminosidade simples
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    
    // Se a cor for branca ou muito clara (luminosidade > 0.9), usar invert
    if (luminance > 0.9) {
      return 'brightness(0) saturate(100%) invert(1)';
    }
    
    // Se a cor for preta ou muito escura (luminosidade < 0.1), usar brightness(0)
    if (luminance < 0.1) {
      return 'brightness(0) saturate(100%)';
    }
    
    // Converter RGB para HSL para calcular hue, saturation e lightness
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    
    let hue = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        hue = ((gNorm - bNorm) / delta) % 6;
        if (hue < 0) hue += 6;
      } else if (max === gNorm) {
        hue = (bNorm - rNorm) / delta + 2;
      } else {
        hue = (rNorm - gNorm) / delta + 4;
      }
      hue = hue * 60;
    }
    // Normalizar hue para 0-360
    hue = ((hue % 360) + 360) % 360;
    
    // Calcular saturação e lightness
    const saturation = max === 0 ? 0 : delta / max;
    const lightness = (max + min) / 2;
    
    // Fórmula melhorada para filtros CSS
    // Converter para preto primeiro, depois aplicar sepia, hue-rotate e saturação
    const hueRotate = Math.round(hue);
    
    // Ajustar saturação - para cores muito saturadas, aumentar o valor
    let saturateValue = Math.round(saturation * 100);
    if (saturation > 0.9) {
      saturateValue = Math.round(saturation * 150); // Aumentar para cores muito saturadas
    }
    
    // Ajustar brilho baseado na lightness
    // Sepia cria uma base amarela, então precisamos ajustar o brilho
    let brightnessValue = 1;
    if (lightness < 0.3) {
      // Cores muito escuras: aumentar brilho significativamente
      brightnessValue = 0.4 + lightness * 1.2;
    } else if (lightness > 0.7) {
      // Cores muito claras: diminuir brilho
      brightnessValue = 1.3 - lightness * 0.4;
    } else {
      // Cores médias: ajuste moderado
      brightnessValue = 0.8 + lightness * 0.4;
    }
    
    // Para cores muito saturadas como vermelho puro, usar fórmula otimizada
    if (saturation > 0.95 && (hueRotate === 0 || hueRotate === 360)) {
      // Vermelho puro ou próximo
      return `brightness(0) saturate(100%) sepia(100%) hue-rotate(0deg) saturate(200%) brightness(${brightnessValue.toFixed(2)})`;
    }
    
    return `brightness(0) saturate(100%) sepia(100%) hue-rotate(${hueRotate}deg) saturate(${saturateValue}%) brightness(${brightnessValue.toFixed(2)})`;
  };

  // Aplicar cores da loja como variáveis CSS
  useEffect(() => {
    const root = document.documentElement;
    const customizations = store?.customizations;
    
    // Log para debug - identificar qual loja está carregada
    if (store) {
      console.log('🎨 [App] Aplicando cores da loja:', {
        storeName: store.name,
        storeSlug: store.slug,
        hasCustomizations: !!customizations,
        primaryColor: customizations?.primaryColor || '#808080',
        secondaryColor: customizations?.secondaryColor || '#2C3E50'
      });
    } else {
      console.log('🎨 [App] Nenhuma loja carregada - usando cores padrão');
    }
    
    if (customizations) {
      const backgroundColor = customizations.backgroundColor || '#FFFFFF';
      const luminance = getLuminance(backgroundColor);
      
      const textColor = customizations.textColor || '#000000';
      
      // Aplicar cores apenas se foram configuradas (não NULL)
      if (customizations.primaryColor) {
        root.style.setProperty('--store-primary-color', customizations.primaryColor);
      } else {
        root.style.setProperty('--store-primary-color', '#808080');  // Neutro apenas para CSS
      }
      
      if (customizations.secondaryColor) {
        root.style.setProperty('--store-secondary-color', customizations.secondaryColor);
      } else {
        root.style.setProperty('--store-secondary-color', '#2C3E50');  // Neutro apenas para CSS
      }
      
      root.style.setProperty('--store-background-color', backgroundColor);
      root.style.setProperty('--store-text-color', textColor);
      
      // Promo banner bg color - se for NULL, não aplicar
      if (customizations.promoBannerBgColor) {
        root.style.setProperty('--store-promo-banner-bg-color', customizations.promoBannerBgColor);
      } else {
        root.style.setProperty('--store-promo-banner-bg-color', '#E8E8E8');  // Neutro apenas para CSS
      }
      
      // Calcular cor de texto dos botões
      const highContrastButtons = customizations.highContrastButtons ?? true;
      console.log('🎨 [App] highContrastButtons:', highContrastButtons, 'textColor:', textColor);
      
      if (highContrastButtons) {
        // Alto contraste: baseado na luminosidade do fundo do botão
        // Se a cor de fundo for escura, texto branco; se clara, texto preto
        // Usar valores neutros se as cores forem NULL
        const primaryColorForLuminance = customizations.primaryColor || '#808080';
        const secondaryColorForLuminance = customizations.secondaryColor || '#2C3E50';
        const primaryLuminance = getLuminance(primaryColorForLuminance);
        const secondaryLuminance = getLuminance(secondaryColorForLuminance);
        root.style.setProperty('--store-primary-button-text', primaryLuminance > 0.5 ? '#000000' : '#FFFFFF');
        root.style.setProperty('--store-secondary-button-text', secondaryLuminance > 0.5 ? '#000000' : '#FFFFFF');
        
        // Calcular filtro para ícones dos botões (trash, etc) baseado na cor do texto do botão
        const primaryButtonTextColor = primaryLuminance > 0.5 ? '#000000' : '#FFFFFF';
        const secondaryButtonTextColor = secondaryLuminance > 0.5 ? '#000000' : '#FFFFFF';
        const primaryButtonIconFilter = getIconFilter(primaryButtonTextColor);
        const secondaryButtonIconFilter = getIconFilter(secondaryButtonTextColor);
        root.style.setProperty('--store-primary-button-icon-filter', primaryButtonIconFilter);
        root.style.setProperty('--store-secondary-button-icon-filter', secondaryButtonIconFilter);
        
        // Link "Ver tudo" com cor verde fixa quando alto contraste está ativado
        root.style.setProperty('--store-readmore-link-color', '#16A34A');
        root.style.setProperty('--store-readmore-link-icon-filter', 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(95deg) brightness(98%) contrast(86%)');
      } else {
        // Sem alto contraste: usar a cor de texto da loja
        root.style.setProperty('--store-primary-button-text', textColor);
        root.style.setProperty('--store-secondary-button-text', textColor);
        
        // Calcular filtro para ícones baseado na cor de texto da loja (usar o mesmo para todos)
        const iconFilter = getIconFilter(textColor);
        root.style.setProperty('--store-primary-button-icon-filter', iconFilter);
        root.style.setProperty('--store-secondary-button-icon-filter', iconFilter);
        root.style.setProperty('--store-icon-filter', iconFilter);
        
        // Link "Ver tudo" com cor de texto da loja quando alto contraste está desativado
        // Usar o mesmo filtro dos ícones gerais
        root.style.setProperty('--store-readmore-link-color', textColor);
        root.style.setProperty('--store-readmore-link-icon-filter', iconFilter);
        console.log('🎨 [App] Alto contraste DESATIVADO - Cor do texto:', textColor, 'Filtro do ícone "Ver tudo":', iconFilter);
      }
      
      // Calcular filtro para os ícones baseado na cor do texto (apenas se alto contraste estiver ativado)
      if (highContrastButtons) {
        const generalIconFilter = getIconFilter(textColor);
        console.log('🎨 [App] Cor do texto:', textColor, 'Filtro gerado:', generalIconFilter);
        root.style.setProperty('--store-icon-filter', generalIconFilter);
      }
      
      // Também definir a máscara usando a URL do SVG como máscara
      // Isso permite usar background-color para colorizar
      // Para ícones de imagem, precisamos usar uma abordagem diferente
      // Vamos usar o filtro como fallback e tentar aplicar a cor via máscara se possível
      
      // Se a cor for clara (luminosidade > 0.5), usar borda mais escura; caso contrário, mais clara
      if (luminance > 0.5) {
        // Cor clara: borda mais escura (misturar com preto)
        root.style.setProperty('--store-menu-border-color', `color-mix(in srgb, ${backgroundColor} 85%, black)`);
        // Cor de fundo clara: input deve ser cinza
        root.style.setProperty('--store-input-background-color', 'rgba(255, 255, 255, 0.5)');
      } else {
        // Cor escura: borda mais clara (misturar com branco)
        root.style.setProperty('--store-menu-border-color', `color-mix(in srgb, ${backgroundColor} 85%, white)`);
        // Cor de fundo escura: input deve ser branco
        root.style.setProperty('--store-input-background-color', '#FFFFFF');
      }
    } else {
      // Valores padrão (cores neutras)
      root.style.setProperty('--store-primary-color', '#808080');
      root.style.setProperty('--store-secondary-color', '#2C3E50');
      root.style.setProperty('--store-background-color', '#FFFFFF');
      root.style.setProperty('--store-text-color', '#000000');
      root.style.setProperty('--store-promo-banner-bg-color', '#E8E8E8');
      root.style.setProperty('--store-menu-border-color', 'color-mix(in srgb, #FFFFFF 85%, black)');
      root.style.setProperty('--store-input-background-color', 'rgba(255, 255, 255, 0.5)');
      root.style.setProperty('--store-icon-filter', 'brightness(0) saturate(100%)');
      root.style.setProperty('--store-primary-button-text', '#000000');
      root.style.setProperty('--store-secondary-button-text', '#000000');
      root.style.setProperty('--store-primary-button-icon-filter', 'brightness(0) saturate(100%)');
      root.style.setProperty('--store-secondary-button-icon-filter', 'brightness(0) saturate(100%)');
      root.style.setProperty('--store-readmore-link-color', '#16A34A');
      root.style.setProperty('--store-readmore-link-icon-filter', 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(95deg) brightness(98%) contrast(86%)');
    }
  }, [store?.customizations]);

  // Manter flag de navegação ativa durante navegações internas
  // NOTA: NÃO criar a flag automaticamente baseado em posição salva,
  // pois pode ser uma posição antiga de sessão anterior.
  // A flag deve ser criada apenas durante navegações internas (no Home.tsx)
  useEffect(() => {
    // Se já existe uma flag de navegação ativa, manter ativa
    if (sessionStorage.getItem('navigationActive')) {
      // Flag já existe, garantir que continue ativa
      sessionStorage.setItem('navigationActive', 'true');
    }
    // Se não há flag, não fazer nada - deixar o Home.tsx gerenciar
    // (Home.tsx vai criar a flag após a primeira carga ser processada)
  }, [location.pathname]);

  // Adicionar padding ao main-content para compensar o header fixo
  // Usar useLayoutEffect para garantir que seja executado antes da pintura
  useLayoutEffect(() => {
    // Não atualizar padding em páginas especiais
    if (isCheckoutPage || isProductDetailsPage || isAdminPage) {
      return;
    }

    // Calcular padding inicial de forma síncrona
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      const isDesktop = window.innerWidth >= 768;
      
      if (!isDesktop) {
        const fixedHeader = document.querySelector('.fixed-header') as HTMLElement;
        let headerHeight = 120; // Valor padrão seguro
        
        if (headerRef.current) {
          headerHeight = headerRef.current.offsetHeight;
        } else if (fixedHeader) {
          headerHeight = fixedHeader.offsetHeight;
        }
        
        if (headerHeight <= 0) {
          headerHeight = 120;
        }
        
        const paddingTop = isSearchOpen ? `${headerHeight + 10}px` : `${headerHeight + 30}px`;
        mainContent.style.paddingTop = paddingTop;
      }
    }
  }, [isSearchOpen, isCheckoutPage, isProductDetailsPage, isAdminPage]);

  // Adicionar padding ao main-content para compensar o header fixo (atualizações dinâmicas)
  useEffect(() => {
    // Não atualizar padding em páginas especiais
    if (isCheckoutPage || isProductDetailsPage || isAdminPage) {
      return;
    }

    const updatePadding = () => {
      const mainContent = document.querySelector('.main-content') as HTMLElement;
      if (!mainContent) {
        // Se main-content ainda não existe, tentar novamente em breve
        return;
      }

      // Verificar se estamos em resolução de desktop (>= 768px)
      const isDesktop = window.innerWidth >= 768;
      
      if (isDesktop) {
        // Em desktop, o header não é fixo, então não precisa de padding extra
        mainContent.style.paddingTop = '';
        return;
      }

      // Em mobile, o header é fixo, então precisa de padding
      // Garantir que o header está completamente renderizado antes de calcular
      const fixedHeader = document.querySelector('.fixed-header') as HTMLElement;
      if (!fixedHeader) {
        // Se o header ainda não existe, aguardar um pouco mais
        return;
      }

      // Aguardar que o header tenha uma altura válida (não seja 0)
      let headerHeight = 0;
      
      if (headerRef.current) {
        headerHeight = headerRef.current.offsetHeight;
      } else if (fixedHeader) {
        headerHeight = fixedHeader.offsetHeight;
      }

      // Se a altura ainda não está disponível, usar valor padrão seguro
      if (headerHeight <= 0) {
        headerHeight = 120; // Valor padrão seguro
      }

      const paddingTop = isSearchOpen ? `${headerHeight + 10}px` : `${headerHeight + 30}px`;
      mainContent.style.paddingTop = paddingTop;
    };

    // Aguardar que o DOM esteja pronto e o header renderizado
    // Usar useLayoutEffect não é possível aqui, então vamos usar múltiplos métodos
    
    // Primeiro, aguardar o próximo frame para garantir que o header foi renderizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updatePadding();
      });
    });

    // Executar imediatamente também
    updatePadding();

    // Usar múltiplos métodos para garantir que seja aplicado após o header estar pronto
    setTimeout(updatePadding, 0);
    setTimeout(updatePadding, 50);
    setTimeout(updatePadding, 100);
    setTimeout(updatePadding, 200);
    setTimeout(updatePadding, 300);
    setTimeout(updatePadding, 500); // Adicionar mais um timeout para garantir

    window.addEventListener('resize', updatePadding);
    
    // Aguardar o carregamento da imagem da logo
    const logoImage = document.querySelector('.logo-image') as HTMLImageElement;
    if (logoImage) {
      if (logoImage.complete) {
        updatePadding();
      } else {
        logoImage.addEventListener('load', updatePadding);
        logoImage.addEventListener('error', updatePadding); // Também atualizar em caso de erro
      }
    }
    
    // Aguardar que todas as imagens do header e promoheader sejam carregadas
    const headerImages = document.querySelectorAll('.fixed-header img');
    let imagesLoaded = 0;
    const totalImages = headerImages.length;
    
    if (totalImages > 0) {
      headerImages.forEach((img) => {
        const image = img as HTMLImageElement;
        if (image.complete) {
          imagesLoaded++;
        } else {
          image.addEventListener('load', () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              updatePadding();
            }
          });
          image.addEventListener('error', () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              updatePadding();
            }
          });
        }
      });
      
      if (imagesLoaded === totalImages) {
        updatePadding();
      }
    }

    // Usar MutationObserver para detectar mudanças no header
    const fixedHeader = document.querySelector('.fixed-header');
    let observer: MutationObserver | null = null;
    
    if (fixedHeader) {
      observer = new MutationObserver(() => {
        updatePadding();
      });
      observer.observe(fixedHeader, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      window.removeEventListener('resize', updatePadding);
      if (logoImage) {
        logoImage.removeEventListener('load', updatePadding);
        logoImage.removeEventListener('error', updatePadding);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isSearchOpen, location, isCheckoutPage, isProductDetailsPage, isAdminPage]);

  // Verificar se há slug na URL e se a loja corresponde - esconder header até loja correta carregar
  const pathMatch = location.pathname.match(/^\/([^\/]+)/);
  const urlSlug = pathMatch ? pathMatch[1] : null;
  const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
  const hasSlugInUrl = urlSlug && !specialRoutes.includes(urlSlug);
  const shouldShowHeader = !isCheckoutPage && !isIdentificationPage && !isProductDetailsPage && !isAdminPage && 
                           (!hasSlugInUrl || (store && store.slug === urlSlug) || !storeLoading);

  return (
    <div className="app">
      {/* RÓTULO: Header com ícones e logo + Banner promocional */}
      {shouldShowHeader && (
        <div className="fixed-header" ref={headerRef}>
          <Header />
          {!isSearchOpen && <PromoBanner />}
        </div>
      )}
      
      {/* Rotas */}
      <Routes>
        {/* Rota raiz - redireciona para login se não houver loja */}
        <Route path="/" element={<RootRedirect />} />
        {/* Rotas Públicas (Loja) - com slug da loja no path */}
        <Route path="/:storeSlug" element={<Home />} />
        <Route path="/:storeSlug/sacola" element={<Checkout />} />
        <Route path="/:storeSlug/sacola/identification" element={<Identification />} />
        <Route path="/:storeSlug/produto/:productId" element={<ProductDetails />} />
        <Route path="/:storeSlug/checkout/identification" element={<Identification />} />
        <Route path="/:storeSlug/checkout/:productId?" element={<Checkout />} />
        
        {/* Rotas antigas (para compatibilidade) */}
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route path="/checkout/identification" element={<Identification />} />
        <Route path="/checkout/:productId?" element={<Checkout />} />
        <Route path="/cart" element={<Checkout />} />
        
        {/* Rotas Admin (Protegidas) */}
        <Route 
          path="/admin" 
          element={<AdminRedirect />} 
        />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/produtos"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/secoes"
          element={
            <ProtectedRoute>
              <AdminSections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/personalizacao"
          element={
            <ProtectedRoute>
              <AdminPersonalization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracoes"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* Barrinha de pedido mínimo */}
      {showMinimumOrderBanner && <MinimumOrderBanner />}
    </div>
  );
}

export default App;
