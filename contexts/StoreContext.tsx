import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StoreCustomizations {
  logoUrl?: string;
  logoAltText?: string;
  promoBannerVisible: boolean;
  promoBannerText: string;
  promoBannerBgColor: string;
  promoBannerTextColor: string;
  promoBannerUseGradient: boolean;
  promoBannerAnimation?: string;
  promoBannerAnimationSpeed?: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  showSearch: boolean;
  showMenu: boolean;
  showCart: boolean;
  showBuyButton: boolean;
  recommendedProductIds: string[];
  minimumOrderValue: number; // Valor mínimo do pedido em centavos
  showFixedButton: boolean; // Mostrar botão flutuante na página de produto
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
  // Informações adicionais da loja
  description?: string;
  address?: string;
  openingHours?: string;
  closingTime?: string;
  paymentMethods?: string[];
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  reloadCustomizations: () => Promise<void>;
  loadStoreByAdminUser: (userId: string) => Promise<void>;
  reloadStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Preservar loja durante navegação - garantir que slug está salvo quando loja está carregada
  useEffect(() => {
    if (store?.slug) {
      sessionStorage.setItem('currentStoreSlug', store.slug);
    }
  }, [store?.slug]);

  useEffect(() => {
    // Timeout de segurança: garantir que loading sempre termine em rotas de auth
    const isAuthRoute = window.location.pathname === '/admin/login' || 
                       window.location.pathname === '/admin/register';
    
    const safetyTimeout = setTimeout(() => {
      if (isAuthRoute) {
        console.warn('StoreContext: Timeout de segurança na rota de auth, finalizando loading');
        setLoading(false);
      }
    }, 500); // 500ms máximo para rotas de auth

    identifyAndLoadStore();

    // Escutar mudanças de autenticação para carregar loja do admin
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [StoreContext] Mudança de autenticação:', event, session?.user?.id);
        
        // Verificar se está em rota admin protegida
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const isAuthRoute = window.location.pathname === '/admin/login' || 
                           window.location.pathname === '/admin/register';
        
        if (isAdminRoute && !isAuthRoute && session?.user) {
          console.log('✅ [StoreContext] Login detectado em rota admin, carregando loja...');
          // Carregar loja do admin que acabou de fazer login
          await loadStoreByAdminUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('🔓 [StoreContext] Logout detectado, limpando store');
          setStore(null);
          sessionStorage.removeItem('currentStoreSlug');
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const identifyAndLoadStore = async () => {
    try {
      // Verificar se está em rota admin (exceto login/register)
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      const isAuthRoute = window.location.pathname === '/admin/login' || 
                         window.location.pathname === '/admin/register';
      
      // Se estiver em página de cadastro/login, não precisa carregar loja
      // IMPORTANTE: terminar loading IMEDIATAMENTE para não travar a página
      if (isAuthRoute) {
        setStore(null);
        setLoading(false);
        return;
      }
      
      if (isAdminRoute && !isAuthRoute) {
        // Em rotas admin protegidas, verificar se há sessão e carregar loja
        console.log('🔍 [StoreContext] Rota admin detectada, verificando sessão...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [StoreContext] Erro ao buscar sessão:', sessionError);
          setStore(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ [StoreContext] Sessão encontrada, carregando loja do admin...');
          await loadStoreByAdminUser(session.user.id);
        } else {
          console.warn('⚠️ [StoreContext] Nenhuma sessão encontrada em rota admin');
          setStore(null);
          setLoading(false);
        }
        return;
      }

      // Se já temos uma loja carregada e ela corresponde ao slug atual, não recarregar
      const storeSlug = getStoreSlug();
      
      if (!storeSlug) {
        // Não tentar carregar loja padrão se não houver slug
        // Isso evita o erro "Loja não encontrada: demo"
        console.warn('⚠️ [StoreContext] Nenhum slug de loja encontrado. A loja não será carregada.');
        console.warn('⚠️ [StoreContext] Para carregar uma loja, use: ?store=slug ou acesse via subdomínio');
        // Se não há slug mas há uma loja carregada, manter ela (navegação interna)
        if (store && store.slug) {
          console.log('✅ [StoreContext] Mantendo loja atual durante navegação:', store.slug);
          setLoading(false);
          return;
        }
        setStore(null);
        setLoading(false);
        return;
      } else {
        // Se já temos a loja carregada com o mesmo slug, não recarregar
        if (store && store.slug === storeSlug) {
          console.log('✅ [StoreContext] Loja já carregada, mantendo:', storeSlug);
          setLoading(false);
          return;
        }
        await loadStoreBySlug(storeSlug);
      }
    } catch (error) {
      console.error('Erro ao identificar loja:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const getStoreSlug = (): string | null => {
    // Método 1: Path-based (ex: /nomedaloja, /nomedaloja/sacola)
    // Extrair slug do primeiro segmento do path
    const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (pathMatch) {
      const firstSegment = pathMatch[1];
      
      // Ignorar rotas admin e outras rotas especiais
      const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
      if (!specialRoutes.includes(firstSegment)) {
        const slug = firstSegment;
        // Salvar no sessionStorage para preservar durante navegação
        sessionStorage.setItem('currentStoreSlug', slug);
        return slug;
      }
    }

    // Método 2: Query parameter (para compatibilidade/desenvolvimento)
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    if (storeParam) {
      // Salvar no sessionStorage para preservar durante navegação
      sessionStorage.setItem('currentStoreSlug', storeParam);
      return storeParam;
    }

    // Método 3: Subdomínio (para produção)
    const hostname = window.location.hostname;
    
    // Produção com subdomínio
    // Ex: loja1.seudominio.com -> extrai "loja1"
    const parts = hostname.split('.');
    if (parts.length >= 3 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const slug = parts[0]; // Primeiro segmento é o slug
      // Salvar no sessionStorage para preservar durante navegação
      sessionStorage.setItem('currentStoreSlug', slug);
      return slug;
    }
    
    // Método 4: Path-based antigo (ex: seudominio.com/loja/slug) - para compatibilidade
    const oldPathMatch = window.location.pathname.match(/^\/loja\/([^\/]+)/);
    if (oldPathMatch) {
      const slug = oldPathMatch[1];
      // Salvar no sessionStorage para preservar durante navegação
      sessionStorage.setItem('currentStoreSlug', slug);
      return slug;
    }

    // Método 5: Verificar sessionStorage (preservar loja durante navegação)
    // Se não encontrou na URL, mas há uma loja salva no sessionStorage, usar ela
    const savedSlug = sessionStorage.getItem('currentStoreSlug');
    if (savedSlug) {
      console.log('📦 [StoreContext] Usando slug salvo do sessionStorage:', savedSlug);
      return savedSlug;
    }

    return null; // Não retornar 'demo' automaticamente
  };

  const loadStoreBySlug = async (slug: string) => {
    console.log('🔍 [StoreContext] Carregando loja por slug:', slug);
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('subscription_status', 'active')
      .single();

    if (error || !data) {
      // Não logar erro se for em página de cadastro/login
      const isAuthRoute = window.location.pathname === '/admin/login' || 
                         window.location.pathname === '/admin/register';
      if (!isAuthRoute) {
        console.error('❌ [StoreContext] Loja não encontrada:', slug, error);
        console.error('❌ [StoreContext] Detalhes do erro:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        });
      }
      // Não tentar carregar loja padrão - apenas retornar
      return;
    }

    console.log('✅ [StoreContext] Loja carregada:', { id: data.id, name: data.name, slug: data.slug });

    const storeData: Store = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      subdomain: data.subdomain,
      ownerEmail: data.owner_email,
      ownerName: data.owner_name,
      subscriptionStatus: data.subscription_status,
      description: data.description || undefined,
      address: data.address || undefined,
      openingHours: data.opening_hours || undefined,
      closingTime: data.closing_time || undefined,
      paymentMethods: (() => {
        if (!data.payment_methods) return undefined;
        if (Array.isArray(data.payment_methods)) return data.payment_methods;
        if (typeof data.payment_methods === 'string') {
          try {
            return JSON.parse(data.payment_methods);
          } catch {
            return [data.payment_methods];
          }
        }
        return data.payment_methods;
      })(),
    };

    setStore(storeData);
    // Garantir que o slug está salvo no sessionStorage
    sessionStorage.setItem('currentStoreSlug', data.slug);
    await loadCustomizations(data.id);
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
        promoBannerAnimation: data.promo_banner_animation || 'gradient',
        promoBannerAnimationSpeed: data.promo_banner_animation_speed ?? 1,
        primaryColor: data.primary_color || '#FF6B35',
        secondaryColor: data.secondary_color || '#004E89',
        backgroundColor: data.background_color || '#FFFFFF',
        textColor: data.text_color || '#000000',
        showSearch: data.show_search ?? true,
        showMenu: data.show_menu ?? true,
        showCart: data.show_cart ?? true,
        showBuyButton: data.show_buy_button ?? true,
        recommendedProductIds: Array.isArray(data.recommended_product_ids) 
          ? data.recommended_product_ids 
          : (data.recommended_product_ids ? [data.recommended_product_ids] : []),
        minimumOrderValue: data.minimum_order_value ?? 0,
        showFixedButton: data.show_fixed_button !== null && data.show_fixed_button !== undefined 
          ? data.show_fixed_button 
          : true,
      };

      setStore(prev => prev ? { ...prev, customizations } : null);
    }
  };

  const reloadCustomizations = async () => {
    if (store?.id) {
      await loadCustomizations(store.id);
    }
  };

  const loadStoreByAdminUser = async (userId: string) => {
    try {
      console.log('🔍 [StoreContext] Carregando loja para admin user:', userId);
      
      // Buscar a loja do admin user
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('store_id')
        .eq('id', userId)
        .single();

      if (adminError || !adminData) {
        console.error('❌ [StoreContext] Admin user não encontrado:', adminError);
        console.error('❌ [StoreContext] Código:', adminError?.code);
        console.error('❌ [StoreContext] Mensagem:', adminError?.message);
        console.error('❌ [StoreContext] Detalhes:', adminError?.details);
        setStore(null);
        setLoading(false);
        return;
      }

      console.log('✅ [StoreContext] Admin user encontrado, store_id:', adminData.store_id);

      // Carregar dados da loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', adminData.store_id)
        .single();

      if (storeError || !storeData) {
        console.error('❌ [StoreContext] Loja não encontrada:', storeError);
        console.error('❌ [StoreContext] Código:', storeError?.code);
        console.error('❌ [StoreContext] Mensagem:', storeError?.message);
        console.error('❌ [StoreContext] Store ID buscado:', adminData.store_id);
        setStore(null);
        setLoading(false);
        return;
      }

      console.log('✅ [StoreContext] Loja encontrada:', { id: storeData.id, name: storeData.name });

      const store: Store = {
        id: storeData.id,
        name: storeData.name,
        slug: storeData.slug,
        subdomain: storeData.subdomain,
        ownerEmail: storeData.owner_email,
        ownerName: storeData.owner_name,
        subscriptionStatus: storeData.subscription_status,
        description: storeData.description || undefined,
        address: storeData.address || undefined,
        openingHours: storeData.opening_hours || undefined,
        closingTime: storeData.closing_time || undefined,
        paymentMethods: storeData.payment_methods ? (Array.isArray(storeData.payment_methods) ? storeData.payment_methods : JSON.parse(storeData.payment_methods)) : undefined,
      };

      setStore(store);
      console.log('✅ [StoreContext] Store configurado, carregando customizações...');
      await loadCustomizations(storeData.id);
      console.log('✅ [StoreContext] Loja carregada com sucesso!');
      setLoading(false);
    } catch (error: any) {
      console.error('❌ [StoreContext] Erro ao carregar loja do admin:', error);
      console.error('❌ [StoreContext] Tipo:', error?.constructor?.name);
      console.error('❌ [StoreContext] Mensagem:', error?.message);
      setStore(null);
      setLoading(false);
    }
  };

  const reloadStore = async () => {
    if (!store?.id) return;
    
    try {
      console.log('🔄 [StoreContext] Recarregando dados da loja:', store.id);
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', store.id)
        .single();

      if (storeError || !storeData) {
        console.error('❌ [StoreContext] Erro ao recarregar loja:', storeError);
        return;
      }

      const updatedStore: Store = {
        id: storeData.id,
        name: storeData.name,
        slug: storeData.slug,
        subdomain: storeData.subdomain,
        ownerEmail: storeData.owner_email,
        ownerName: storeData.owner_name,
        subscriptionStatus: storeData.subscription_status,
        description: storeData.description || undefined,
        address: storeData.address || undefined,
        openingHours: storeData.opening_hours || undefined,
        closingTime: storeData.closing_time || undefined,
        paymentMethods: storeData.payment_methods ? (Array.isArray(storeData.payment_methods) ? storeData.payment_methods : JSON.parse(storeData.payment_methods)) : undefined,
      };

      setStore(updatedStore);
      console.log('✅ [StoreContext] Loja recarregada com sucesso');
    } catch (error: any) {
      console.error('❌ [StoreContext] Erro ao recarregar loja:', error);
    }
  };

  return (
    <StoreContext.Provider value={{ store, loading, reloadCustomizations, loadStoreByAdminUser, reloadStore }}>
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

