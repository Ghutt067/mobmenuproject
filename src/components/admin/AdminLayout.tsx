import { ReactNode } from 'react';
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

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Painel Admin</h2>
          {store && <p className="store-name">{store.name}</p>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/admin/produtos" className={isActive('/admin/produtos')}>
            <span className="nav-icon">🛍️</span>
            Produtos
          </Link>
          <Link to="/admin/secoes" className={isActive('/admin/secoes')}>
            <span className="nav-icon">📑</span>
            Seções
          </Link>
          <Link to="/admin/personalizacao" className={isActive('/admin/personalizacao')}>
            <span className="nav-icon">🎨</span>
            Personalização
          </Link>
          <Link to="/admin/configuracoes" className={isActive('/admin/configuracoes')}>
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

