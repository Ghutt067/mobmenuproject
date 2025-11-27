import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';

/**
 * Hook para facilitar navegação com o slug da loja no path
 * Exemplo: /nomedaloja, /nomedaloja/sacola, /nomedaloja/produto/123
 */
export function useStoreNavigation() {
  const navigate = useNavigate();
  const { store } = useStore();

  /**
   * Navega para uma rota incluindo o slug da loja no path
   * @param path - Caminho relativo (ex: '/sacola', '/produto/123')
   * @param options - Opções do navigate do react-router-dom
   */
  const navigateWithStore = (path: string, options?: any) => {
    if (!store?.slug) {
      console.warn('⚠️ [useStoreNavigation] Loja não carregada, navegando sem slug');
      navigate(path, options);
      return;
    }

    // Remover barra inicial se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Construir path completo com slug da loja
    const fullPath = `/${store.slug}${cleanPath ? `/${cleanPath}` : ''}`;
    
    navigate(fullPath, options);
  };

  /**
   * Retorna o path completo com o slug da loja
   * Útil para construir links ou URLs
   */
  const getStorePath = (path: string): string => {
    if (!store?.slug) {
      return path;
    }

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${store.slug}${cleanPath ? `/${cleanPath}` : ''}`;
  };

  return {
    navigate: navigateWithStore,
    getStorePath,
    storeSlug: store?.slug || null,
  };
}

