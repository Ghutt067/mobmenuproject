import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [forceRedirect, setForceRedirect] = useState(false);

  // Timeout de segurança: se após 2 segundos ainda estiver carregando, forçar redirecionamento
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setForceRedirect(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setForceRedirect(false);
    }
  }, [loading]);

  // Se o timeout foi atingido ou não está mais carregando, verificar autenticação
  useEffect(() => {
    if ((!loading || forceRedirect) && !user) {
      // Usar window.location.href para forçar reload completo e limpar estados
      window.location.href = '/admin/login';
    }
  }, [loading, forceRedirect, user]);

  // Se não houver usuário, mostrar loading enquanto redireciona
  if (!loading && !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        Redirecionando...
      </div>
    );
  }

  // Se estiver carregando, mostrar loading
  if (loading && !forceRedirect) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        Carregando...
      </div>
    );
  }

  // Usuário autenticado, mostrar conteúdo
  if (user) {
    return <>{children}</>;
  }

  // Fallback
  return null;
}

