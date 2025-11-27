import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import AdminLayout from '../../components/admin/AdminLayout';
import './Dashboard.css';

export default function AdminDashboard() {
  const { store } = useStore();

  return (
    <AdminLayout>
      <div className="dashboard-page">
        <h1>Dashboard</h1>
        <p className="subtitle">Bem-vindo ao painel de administração da sua loja</p>

        <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎨</div>
                <div className="stat-content">
                  <h3>Personalização</h3>
                  <p className="stat-value">
                    {store?.customizations ? 'Ativa' : 'Padrão'}
                  </p>
                  <p className="stat-detail">Cores e logo</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Status da Loja</h3>
                  <p className="stat-value">Ativa</p>
                  <p className="stat-detail">Assinatura vigente</p>
                </div>
              </div>
            </div>

        <div className="quick-actions">
              <h2>Ações Rápidas</h2>
              <div className="actions-grid">
                <Link to="/admin/produtos" className="action-card">
                  <span className="action-icon">➕</span>
                  <h3>Adicionar Produto</h3>
                  <p>Cadastre um novo produto</p>
                </Link>

                <Link to="/" className="action-card">
                  <span className="action-icon">👁️</span>
                  <h3>Visualizar Loja</h3>
                  <p>Ver como os clientes veem</p>
                </Link>
              </div>
            </div>
      </div>
    </AdminLayout>
  );
}

