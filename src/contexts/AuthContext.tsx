import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from './StoreContext';
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
  const { store } = useStore();

  useEffect(() => {
    checkSession();

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [store]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserData(session.user);
    }
    setLoading(false);
  };

  const loadUserData = async (authUser: User) => {
    try {
      // Buscar dados do admin no banco
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        console.error('Usuário admin não encontrado:', error);
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // Verificar se o usuário pertence à loja atual (se store estiver carregado)
      if (store && data.store_id !== store.id) {
        console.warn('Usuário não pertence a esta loja');
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser({
        id: data.id,
        email: data.email,
        storeId: data.store_id,
        role: data.role,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    if (!store) {
      throw new Error('Loja não identificada. Recarregue a página.');
    }

    try {
      // Login com Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar se o usuário pertence a esta loja
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .eq('store_id', store.id)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          throw new Error('Acesso não autorizado para esta loja');
        }

        await loadUserData(data.user);
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
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

