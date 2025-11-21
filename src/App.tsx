import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import PromoBanner from './components/PromoBanner';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import Identification from './pages/Identification';
import ProductDetails from './pages/ProductDetails';
import { useSearch } from './contexts/SearchContext';

// Páginas Admin
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminSections from './pages/admin/Sections';
import AdminCustomization from './pages/admin/Customization';
import AdminSettings from './pages/admin/Settings';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isSearchOpen } = useSearch();
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const isIdentificationPage = location.pathname === '/checkout/identification';
  const isProductDetailsPage = location.pathname.startsWith('/product/');
  const isAdminPage = location.pathname.startsWith('/admin');

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
        {/* Rotas Públicas (Loja) */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route path="/checkout/identification" element={<Identification />} />
        <Route path="/checkout/:productId?" element={<Checkout />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* Rotas Admin (Protegidas) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
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
              <AdminCustomization />
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
    </div>
  );
}

export default App;
