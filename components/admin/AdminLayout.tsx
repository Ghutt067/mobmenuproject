import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <button 
        className={`mobile-menu-toggle ${sidebarOpen ? 'open' : ''}`} 
        onClick={toggleSidebar} 
        aria-label="Toggle menu"
      >
        <span className="menu-icon">{sidebarOpen ? '×' : '☰'}</span>
      </button>
      
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Painel Admin</h2>
          {store && <p className="store-name">{store.name}</p>}
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">×</button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={isActive('/admin/dashboard')} onClick={closeSidebar}>
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/admin/produtos" className={isActive('/admin/produtos')} onClick={closeSidebar}>
            <span className="nav-icon">🛍️</span>
            Produtos/Seções
          </Link>
          <Link to="/admin/personalizacao" className={isActive('/admin/personalizacao')} onClick={closeSidebar}>
            <span className="nav-icon">🎨</span>
            Personalização
          </Link>
          <Link to="/admin/configuracoes" className={isActive('/admin/configuracoes')} onClick={closeSidebar}>
            <span className="nav-icon">⚙️</span>
            Configurações
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
          <Link to="/" className="view-store-link">
            Ver Loja →
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

