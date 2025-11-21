import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../contexts/StoreContext';
import AdminLayout from '../../components/admin/AdminLayout';
import './Dashboard.css';

export default function AdminDashboard() {
  const { store } = useStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSets: 0,
    activeSets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [store]);

  const loadStats = async () => {
    if (!store) return;

    setLoading(true);

    try {
      // Contar produtos
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id);

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true);

      // Contar seções
      const { count: totalSets } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id);

      const { count: activeSets } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true);

      setStats({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalSets: totalSets || 0,
        activeSets: activeSets || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="dashboard-page">
        <h1>Dashboard</h1>
        <p className="subtitle">Bem-vindo ao painel de administração da sua loja</p>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🛍️</div>
                <div className="stat-content">
                  <h3>Produtos Ativos</h3>
                  <p className="stat-value">{stats.activeProducts}</p>
                  <p className="stat-detail">de {stats.totalProducts} total</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📑</div>
                <div className="stat-content">
                  <h3>Seções Ativas</h3>
                  <p className="stat-value">{stats.activeSets}</p>
                  <p className="stat-detail">de {stats.totalSets} total</p>
                </div>
              </div>

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

                <Link to="/admin/secoes" className="action-card">
                  <span className="action-icon">📝</span>
                  <h3>Gerenciar Seções</h3>
                  <p>Organize suas categorias</p>
                </Link>

                <Link to="/admin/personalizacao" className="action-card">
                  <span className="action-icon">🎨</span>
                  <h3>Personalizar Loja</h3>
                  <p>Cores, logo e banner</p>
                </Link>

                <Link to="/" className="action-card">
                  <span className="action-icon">👁️</span>
                  <h3>Visualizar Loja</h3>
                  <p>Ver como os clientes veem</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

