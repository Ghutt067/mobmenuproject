import { useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../contexts/AuthContext';
import Home from '../Home';
import Header from '../../components/Header';
import PromoBanner from '../../components/PromoBanner';
import { useSearch } from '../../contexts/SearchContext';
import './Customization.css';

export default function AdminCustomization() {
  const { store, loading, loadStoreByAdminUser } = useStore();
  const { user } = useAuth();
  const { isSearchOpen } = useSearch();

  useEffect(() => {
    // Scroll para o topo quando a página carregar
    window.scrollTo(0, 0);
    
    // Se não há store mas há usuário autenticado, tentar carregar
    if (!store && !loading && user) {
      loadStoreByAdminUser(user.id);
    }
  }, [store, loading, user, loadStoreByAdminUser]);

  if (loading || !store) {
    return (
      <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
        {loading ? 'Carregando loja...' : 'Não foi possível carregar a loja.'}
      </div>
    );
  }

  // Renderizar exatamente como a rota "/" - sem nenhum wrapper
  return (
    <div className="app">
      <div className="fixed-header">
        <Header />
        {!isSearchOpen && <PromoBanner />}
      </div>
      <Home previewMode={true} />
    </div>
  );
}

