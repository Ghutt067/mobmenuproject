import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  email: string;
  storeId: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialCheckDone = false;

    // Timeout de segurança: garantir que loading sempre termine
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialCheckDone) {
        console.warn('AuthContext: Timeout de segurança ativado, finalizando loading');
        setUser(null);
        setLoading(false);
        initialCheckDone = true;
      }
    }, 3000); // 3 segundos máximo

    // Verificar sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          clearTimeout(safetyTimeout);
          return;
        }

        if (error) {
          console.error('Erro ao buscar sessão:', error);
          setUser(null);
          setLoading(false);
          initialCheckDone = true;
          clearTimeout(safetyTimeout);
          return;
        }

        // Se não houver sessão, terminar loading imediatamente
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          initialCheckDone = true;
          clearTimeout(safetyTimeout);
          return;
        }

        // Se houver sessão, carregar dados do usuário
        const success = await loadUserData(session.user);
        if (!success) {
          // Se não conseguiu carregar os dados, já foi feito signOut no loadUserData
          setUser(null);
        }
        
        if (mounted) {
          initialCheckDone = true;
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          initialCheckDone = true;
          clearTimeout(safetyTimeout);
        }
      }
    };

    initAuth();

    // Ouvir mudanças de autenticação futuras (após verificação inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar eventos até que a verificação inicial termine
        if (!initialCheckDone || !mounted) return;
        
        try {
          if (session?.user) {
            const success = await loadUserData(session.user);
            if (!success) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Erro ao processar mudança de autenticação:', error);
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
  };
  }, []);

  const loadUserData = async (authUser: User): Promise<boolean> => {
    try {
      // Timeout para a query: máximo 2 segundos
      const queryPromise = supabase
        .from('admin_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar dados do usuário')), 2000)
      );

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (error || !data) {
        console.error('Usuário admin não encontrado:', error);
        // Se não encontrar o usuário admin, fazer signOut para limpar a sessão
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Erro ao fazer signOut:', signOutError);
        }
        setUser(null);
        return false;
      }

      // Configurar usuário
      setUser({
        id: data.id,
        email: data.email,
        storeId: data.store_id,
        role: data.role,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Em caso de erro ou timeout, fazer signOut para limpar a sessão
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Erro ao fazer signOut:', signOutError);
      }
      setUser(null);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando login...');
      
      // Login com Supabase Auth (sem timeout, deixar o Supabase gerenciar)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no signIn:', error);
        throw error;
      }

      if (!data?.user) {
        console.error('❌ Nenhum usuário retornado');
        throw new Error('Erro ao fazer login. Tente novamente.');
      }

      console.log('✅ SignIn bem-sucedido, buscando dados do admin...');

      // Verificar se o usuário é um admin válido e carregar dados diretamente
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (adminError || !adminData) {
        console.error('❌ Erro ao buscar admin:', adminError);
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Erro ao fazer signOut:', signOutError);
        }
        throw new Error('Usuário não encontrado como administrador');
      }

      console.log('✅ Dados do admin carregados:', adminData.email);

      // Carregar dados do usuário diretamente
      setUser({
        id: adminData.id,
        email: adminData.email,
        storeId: adminData.store_id,
        role: adminData.role,
      });

      console.log('✅ Login completo!');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      // Limpar usuário em caso de erro
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

