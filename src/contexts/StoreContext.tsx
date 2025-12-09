import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StoreCustomizations {
  logoUrl?: string;
  logoAltText?: string;
  profileImageUrl?: string; // Foto de perfil exibida no checkout
  checkoutTheme?: 'ecommerce' | 'local'; // Tema do checkout
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
  highContrastButtons: boolean; // Botões de alto contraste (preto/branco baseado na luminosidade)
  recommendedProductIds: string[];
  featuredProductIds: string[]; // IDs dos produtos em destaque (aparecem abaixo do PromoBanner)
  minimumOrderValue: number; // Valor mínimo do pedido em centavos
  showFixedButton: boolean; // Mostrar botão flutuante na página de produto
}

interface OperatingDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: boolean;
  openTime?: string;
  closeTime?: string;
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
  // Novos campos de localização e horários
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  operatingDays?: OperatingDay[];
  isClosed?: boolean;
  appointmentOnlyMode?: boolean;
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

  // Limpar loja quando o pathname mudar para evitar mostrar loja errada
  useEffect(() => {
    const urlSlug = (() => {
      const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
      if (pathMatch) {
        const firstSegment = pathMatch[1];
        const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
        if (!specialRoutes.includes(firstSegment)) {
          return firstSegment;
        }
      }
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('store');
    })();

    // Se há slug na URL e é diferente da loja atual, limpar imediatamente
    if (urlSlug && store && store.slug !== urlSlug) {
      console.log(`🚨 [StoreContext] Pathname mudou - limpando loja atual (${store.slug}) para carregar (${urlSlug})`);
      setStore(null);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    // LIMPAR sessionStorage se há slug na URL diferente do salvo
    const urlSlug = (() => {
      const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
      if (pathMatch) {
        const firstSegment = pathMatch[1];
        const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
        if (!specialRoutes.includes(firstSegment)) {
          return firstSegment;
        }
      }
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('store');
    })();

    if (urlSlug) {
      const savedSlug = sessionStorage.getItem('currentStoreSlug');
      if (savedSlug && savedSlug !== urlSlug) {
        console.log(`🧹 [StoreContext] Limpando sessionStorage: slug salvo (${savedSlug}) diferente do URL (${urlSlug})`);
        sessionStorage.removeItem('currentStoreSlug');
        // Limpar estado da loja também se for diferente
        setStore(null);
      }
    }

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
      // Verificar se está na rota raiz - não carregar loja, apenas redirecionar
      if (window.location.pathname === '/') {
        console.log('🔀 [StoreContext] Rota raiz detectada, limpando loja e sessionStorage...');
        setStore(null);
        sessionStorage.removeItem('currentStoreSlug');
        setLoading(false);
        return;
      }
      
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

      // Primeiro, obter o slug da URL (sem usar sessionStorage ainda)
      const urlSlug = getStoreSlugFromUrl();
      
      // IMPORTANTE: Se há um slug na URL diferente da loja atual, LIMPAR imediatamente
      if (urlSlug && store && store.slug !== urlSlug) {
        console.log(`🔄 [StoreContext] Slug da URL (${urlSlug}) diferente da loja atual (${store.slug}), limpando estado...`);
        setStore(null);
        // Limpar sessionStorage também para evitar confusão
        sessionStorage.removeItem('currentStoreSlug');
      }
      
      const storeSlug = getStoreSlug();
      
      if (!storeSlug) {
        // Não tentar carregar loja padrão se não houver slug
        console.warn('⚠️ [StoreContext] Nenhum slug de loja encontrado. A loja não será carregada.');
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
        // Limpar estado antes de carregar nova loja
        if (store) {
          setStore(null);
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

  // Função auxiliar para obter slug APENAS da URL (sem sessionStorage)
  const getStoreSlugFromUrl = (): string | null => {
    // Método 1: Path-based (ex: /nomedaloja, /nomedaloja/sacola)
    const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (pathMatch) {
      const firstSegment = pathMatch[1];
      const specialRoutes = ['admin', 'checkout', 'product', 'cart', 'loja'];
      if (!specialRoutes.includes(firstSegment)) {
        return firstSegment;
      }
    }

    // Método 2: Query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    if (storeParam) {
      return storeParam;
    }

    // Método 3: Subdomínio
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return parts[0];
    }
    
    // Método 4: Path-based antigo
    const oldPathMatch = window.location.pathname.match(/^\/loja\/([^\/]+)/);
    if (oldPathMatch) {
      return oldPathMatch[1];
    }

    return null;
  };

  const getStoreSlug = (): string | null => {
    // PRIMEIRO: Sempre verificar URL primeiro (tem prioridade)
    const urlSlug = getStoreSlugFromUrl();
    
    if (urlSlug) {
      // Há slug na URL - usar ele e atualizar sessionStorage
      const savedSlug = sessionStorage.getItem('currentStoreSlug');
      if (savedSlug && savedSlug !== urlSlug) {
        console.log(`🔄 [StoreContext] Slug na URL (${urlSlug}) diferente do salvo (${savedSlug}), atualizando...`);
      }
      sessionStorage.setItem('currentStoreSlug', urlSlug);
      return urlSlug;
    }

    // Se NÃO há slug na URL, verificar sessionStorage (apenas para navegação interna)
    // MAS: só usar se estivermos em uma rota de loja (não admin, não raiz)
    const savedSlug = sessionStorage.getItem('currentStoreSlug');
    if (savedSlug) {
      const pathname = window.location.pathname;
      const isRoot = pathname === '/';
      const isAdminRoute = pathname.startsWith('/admin');
      
      // Se estiver na raiz ou em admin, NÃO usar sessionStorage
      if (isRoot || isAdminRoute) {
        console.log(`🧹 [StoreContext] Rota raiz/admin detectada, limpando sessionStorage (slug: ${savedSlug})...`);
        sessionStorage.removeItem('currentStoreSlug');
        return null;
      }
      
      console.log('📦 [StoreContext] Nenhum slug na URL, usando slug do sessionStorage:', savedSlug);
      return savedSlug;
    }

    // Nenhum slug encontrado
    return null;
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
      
      // IMPORTANTE: Limpar sessionStorage se a loja não foi encontrada
      // Isso evita tentar carregar a mesma loja inexistente novamente
      const savedSlug = sessionStorage.getItem('currentStoreSlug');
      if (savedSlug === slug) {
        console.log(`🧹 [StoreContext] Loja não encontrada (${slug}), limpando sessionStorage...`);
        sessionStorage.removeItem('currentStoreSlug');
        // Limpar também o estado da loja
        setStore(null);
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
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      timezone: data.timezone || 'America/Sao_Paulo',
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      operatingDays: data.operating_days ? (Array.isArray(data.operating_days) ? data.operating_days : JSON.parse(data.operating_days)) : undefined,
      isClosed: data.is_closed ?? false,
      appointmentOnlyMode: data.appointment_only_mode ?? false,
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
        profileImageUrl: data.profile_image_url,
        checkoutTheme: (data.checkout_theme === 'local' || data.checkout_theme === 'ecommerce') ? data.checkout_theme : 'ecommerce',
        promoBannerVisible: data.promo_banner_visible ?? false,  // Oculto por padrão se não configurado
        promoBannerText: data.promo_banner_text || '',
        promoBannerBgColor: data.promo_banner_bg_color || null,  // NULL se não configurado
        promoBannerTextColor: data.promo_banner_text_color || '#000000',
        promoBannerUseGradient: data.promo_banner_use_gradient ?? true,
        promoBannerAnimation: data.promo_banner_animation || 'blink',
        promoBannerAnimationSpeed: data.promo_banner_animation_speed ?? 1,
        primaryColor: data.primary_color || null,  // NULL se não configurado
        secondaryColor: data.secondary_color || null,  // NULL se não configurado
        backgroundColor: data.background_color || '#FFFFFF',
        textColor: data.text_color || '#000000',
        showSearch: data.show_search ?? true,
        showMenu: data.show_menu ?? true,
        showCart: data.show_cart ?? true,
        showBuyButton: data.show_buy_button ?? true,
        highContrastButtons: data.high_contrast_buttons ?? true,
        recommendedProductIds: Array.isArray(data.recommended_product_ids) 
          ? data.recommended_product_ids 
          : (data.recommended_product_ids ? [data.recommended_product_ids] : []),
        featuredProductIds: Array.isArray(data.featured_product_ids) 
          ? data.featured_product_ids 
          : (data.featured_product_ids ? [data.featured_product_ids] : []),
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
        city: storeData.city || undefined,
        state: storeData.state || undefined,
        country: storeData.country || undefined,
        timezone: storeData.timezone || 'America/Sao_Paulo',
        latitude: storeData.latitude ? parseFloat(storeData.latitude) : undefined,
        longitude: storeData.longitude ? parseFloat(storeData.longitude) : undefined,
        operatingDays: storeData.operating_days ? (Array.isArray(storeData.operating_days) ? storeData.operating_days : JSON.parse(storeData.operating_days)) : undefined,
        isClosed: storeData.is_closed ?? false,
        appointmentOnlyMode: storeData.appointment_only_mode ?? false,
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
        city: storeData.city || undefined,
        state: storeData.state || undefined,
        country: storeData.country || undefined,
        timezone: storeData.timezone || 'America/Sao_Paulo',
        latitude: storeData.latitude ? parseFloat(storeData.latitude) : undefined,
        longitude: storeData.longitude ? parseFloat(storeData.longitude) : undefined,
        operatingDays: storeData.operating_days ? (Array.isArray(storeData.operating_days) ? storeData.operating_days : JSON.parse(storeData.operating_days)) : undefined,
        isClosed: storeData.is_closed ?? false,
        appointmentOnlyMode: storeData.appointment_only_mode ?? false,
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

