import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que redireciona a rota raiz "/" para "/admin/login"
 * Esta é a primeira página que aparece quando acessa o site
 */
export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar imediatamente para a página de login
    console.log('🔀 [RootRedirect] Redirecionando para /admin/login');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  // Mostrar loading enquanto redireciona
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

