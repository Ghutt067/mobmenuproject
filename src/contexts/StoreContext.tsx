import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface StoreCustomizations {
  logoUrl?: string;
  logoAltText?: string;
  promoBannerVisible: boolean;
  promoBannerText: string;
  promoBannerBgColor: string;
  promoBannerTextColor: string;
  promoBannerUseGradient: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  showSearch: boolean;
  showMenu: boolean;
  showCart: boolean;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  ownerEmail: string;
  ownerName: string;
  subscriptionStatus: string;
  customizations?: StoreCustomizations;
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  reloadCustomizations: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    identifyAndLoadStore();
  }, []);

  const identifyAndLoadStore = async () => {
    try {
      const storeSlug = getStoreSlug();
      
      if (!storeSlug) {
        // Tentar carregar a primeira loja ativa como fallback
        await loadDefaultStore();
      } else {
        await loadStoreBySlug(storeSlug);
      }
    } catch (error) {
      console.error('Erro ao identificar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStoreSlug = (): string | null => {
    // Método 1: Query parameter (para desenvolvimento)
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    if (storeParam) return storeParam;

    // Método 2: Subdomínio (para produção)
    const hostname = window.location.hostname;
    
    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'demo'; // Slug padrão para desenvolvimento
    }
    
    // Produção com subdomínio
    // Ex: loja1.seudominio.com -> extrai "loja1"
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // Primeiro segmento é o slug
    }
    
    // Método 3: Path-based (ex: seudominio.com/loja/slug)
    const pathMatch = window.location.pathname.match(/^\/loja\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    return null;
  };

  const loadStoreBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('subscription_status', 'active')
      .single();

    if (error || !data) {
      console.error('Loja não encontrada:', slug, error);
      await loadDefaultStore();
      return;
    }

    const storeData: Store = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      subdomain: data.subdomain,
      ownerEmail: data.owner_email,
      ownerName: data.owner_name,
      subscriptionStatus: data.subscription_status,
    };

    setStore(storeData);
    await loadCustomizations(data.id);
  };

  const loadDefaultStore = async () => {
    // Carregar primeira loja ativa
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('subscription_status', 'active')
      .limit(1)
      .single();

    if (data) {
      const storeData: Store = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        subdomain: data.subdomain,
        ownerEmail: data.owner_email,
        ownerName: data.owner_name,
        subscriptionStatus: data.subscription_status,
      };

      setStore(storeData);
      await loadCustomizations(data.id);
    }
  };

  const loadCustomizations = async (storeId: string) => {
    const { data } = await supabase
      .from('store_customizations')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (data) {
      const customizations: StoreCustomizations = {
        logoUrl: data.logo_url,
        logoAltText: data.logo_alt_text,
        promoBannerVisible: data.promo_banner_visible ?? true,
        promoBannerText: data.promo_banner_text || 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
        promoBannerBgColor: data.promo_banner_bg_color || '#FDD8A7',
        promoBannerTextColor: data.promo_banner_text_color || '#000000',
        promoBannerUseGradient: data.promo_banner_use_gradient ?? true,
        primaryColor: data.primary_color || '#FF6B35',
        secondaryColor: data.secondary_color || '#004E89',
        backgroundColor: data.background_color || '#FFFFFF',
        textColor: data.text_color || '#000000',
        showSearch: data.show_search ?? true,
        showMenu: data.show_menu ?? true,
        showCart: data.show_cart ?? true,
      };

      setStore(prev => prev ? { ...prev, customizations } : null);
    }
  };

  const reloadCustomizations = async () => {
    if (store?.id) {
      await loadCustomizations(store.id);
    }
  };

  return (
    <StoreContext.Provider value={{ store, loading, reloadCustomizations }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};

