import { useEffect, useRef } from 'react';
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
  const { store } = useStore();
  const { cartItems } = useCart();
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
    
    if (customizations) {
      const backgroundColor = customizations.backgroundColor || '#FFFFFF';
      const luminance = getLuminance(backgroundColor);
      
      const textColor = customizations.textColor || '#000000';
      
      root.style.setProperty('--store-primary-color', customizations.primaryColor || '#FF6B35');
      root.style.setProperty('--store-secondary-color', customizations.secondaryColor || '#004E89');
      root.style.setProperty('--store-background-color', backgroundColor);
      root.style.setProperty('--store-text-color', textColor);
      root.style.setProperty('--store-promo-banner-bg-color', customizations.promoBannerBgColor || '#FDD8A7');
      
      // Calcular filtro para os ícones baseado na cor do texto
      const iconFilter = getIconFilter(textColor);
      root.style.setProperty('--store-icon-filter', iconFilter);
      
      // Se a cor for clara (luminosidade > 0.5), usar borda mais escura; caso contrário, mais clara
      if (luminance > 0.5) {
        // Cor clara: borda mais escura (misturar com preto)
        root.style.setProperty('--store-menu-border-color', `color-mix(in srgb, ${backgroundColor} 85%, black)`);
      } else {
        // Cor escura: borda mais clara (misturar com branco)
        root.style.setProperty('--store-menu-border-color', `color-mix(in srgb, ${backgroundColor} 85%, white)`);
      }
    } else {
      // Valores padrão
      root.style.setProperty('--store-primary-color', '#FF6B35');
      root.style.setProperty('--store-secondary-color', '#004E89');
      root.style.setProperty('--store-background-color', '#FFFFFF');
      root.style.setProperty('--store-text-color', '#000000');
      root.style.setProperty('--store-promo-banner-bg-color', '#FDD8A7');
      root.style.setProperty('--store-menu-border-color', 'color-mix(in srgb, #FFFFFF 85%, black)');
      root.style.setProperty('--store-icon-filter', 'brightness(0) saturate(100%)');
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

  useEffect(() => {
    // Não atualizar padding em páginas especiais
    if (isCheckoutPage || isProductDetailsPage || isAdminPage) {
      return;
    }

    const updatePadding = () => {
      if (headerRef.current) {
        const mainContent = document.querySelector('.main-content, .cart-content') as HTMLElement;
        if (mainContent) {
          // Verificar se estamos em resolução de desktop (>= 768px)
          const isDesktop = window.innerWidth >= 768;
          
          if (isDesktop) {
            // Em desktop, o header não é fixo, então não precisa de padding extra
            mainContent.style.paddingTop = '';
          } else {
            // Em mobile, o header é fixo, então precisa de padding
            const headerHeight = headerRef.current.offsetHeight;
          const paddingTop = isSearchOpen ? `${headerHeight + 10}px` : `${headerHeight + 30}px`;
          mainContent.style.paddingTop = paddingTop;
          }
        }
      }
    };

    // Executar imediatamente
    updatePadding();

    // Usar múltiplos métodos para garantir que seja aplicado
    requestAnimationFrame(updatePadding);
    setTimeout(updatePadding, 0);
    setTimeout(updatePadding, 50);
    setTimeout(updatePadding, 100);
    setTimeout(updatePadding, 200);

    window.addEventListener('resize', updatePadding);
    
    // Aguardar o carregamento da imagem da logo
    const logoImage = document.querySelector('.logo-image') as HTMLImageElement;
    if (logoImage) {
      if (logoImage.complete) {
        updatePadding();
      } else {
        logoImage.addEventListener('load', updatePadding);
      }
    }

    return () => {
      window.removeEventListener('resize', updatePadding);
      if (logoImage) {
        logoImage.removeEventListener('load', updatePadding);
      }
    };
  }, [isSearchOpen, location, isCheckoutPage]);

  return (
    <div className="app">
      {/* RÓTULO: Header com ícones e logo + Banner promocional */}
      {!isCheckoutPage && !isIdentificationPage && !isProductDetailsPage && !isAdminPage && (
        <div className="fixed-header" ref={headerRef}>
          <Header />
          {!isSearchOpen && <PromoBanner />}
        </div>
      )}
      
      {/* Rotas */}
      <Routes>
        {/* Rotas Públicas (Loja) - com slug da loja no path */}
        <Route path="/" element={<Home />} />
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
