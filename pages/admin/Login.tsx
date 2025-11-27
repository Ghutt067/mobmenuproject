import { useState, useEffect, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import showIcon from '../../icons/show.svg';
import hideIcon from '../../icons/hide.svg';
import './Login.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [isEmailDropdownClosing, setIsEmailDropdownClosing] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Garantir que a página sempre renderize, mesmo se contexts estiverem carregando
  // A página de login não deve depender do loading dos contexts

  // Verificar se há mensagem de sucesso do cadastro
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email) {
        setEmail(state.email);
      }
    }
  }, [location]);

  const emailDomains = [
    'gmail.com',
    'live.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'uol.com.br',
    'bol.com.br',
    'ig.com.br',
    'terra.com.br'
  ];

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      setEmail(value);
      
      // Mostrar dropdown de sugestões de e-mail quando estiver digitando
      if (value.length > 0 && !value.includes('@')) {
        setIsEmailDropdownOpen(true);
      } else if (value.includes('@')) {
        const [localPart, domainPart] = value.split('@');
        if (localPart && domainPart && domainPart.length > 0) {
          setIsEmailDropdownOpen(true);
        } else if (localPart && !domainPart) {
          setIsEmailDropdownOpen(true);
        } else {
          setIsEmailDropdownOpen(false);
        }
      } else if (value.length === 0) {
        setIsEmailDropdownOpen(false);
      }
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  // Calcular sugestões de e-mail
  const emailSuggestions = useMemo(() => {
    if (!email || email.length === 0) {
      return [];
    }

    const emailValue = email.toLowerCase();
    
    // Se não tem @, usar o texto digitado como nome
    if (!emailValue.includes('@')) {
      return emailDomains.map(domain => `${emailValue}@${domain}`);
    }

    // Se tem @, separar nome e domínio parcial
    const [localPart, domainPart] = emailValue.split('@');
    
    if (!localPart || localPart.length === 0) {
      return [];
    }

    // Se tem domínio parcial, filtrar domínios que começam com ele
    if (domainPart && domainPart.length > 0) {
      return emailDomains
        .filter(domain => domain.startsWith(domainPart))
        .map(domain => `${localPart}@${domain}`);
    }

    // Se não tem domínio parcial, mostrar todos
    return emailDomains.map(domain => `${localPart}@${domain}`);
  }, [email]);

  // Fechar dropdown automaticamente quando o email corresponder exatamente a uma sugestão
  useEffect(() => {
    if (email && emailSuggestions.length > 0 && isEmailDropdownOpen) {
      const emailLower = email.toLowerCase();
      const exactMatch = emailSuggestions.some(suggestion => suggestion.toLowerCase() === emailLower);
      if (exactMatch) {
        setIsEmailDropdownClosing(true);
        setTimeout(() => {
          setIsEmailDropdownOpen(false);
          setIsEmailDropdownClosing(false);
        }, 300);
      }
    }
  }, [email, emailSuggestions, isEmailDropdownOpen]);

  const handleEmailSuggestionClick = (suggestion: string) => {
    setEmail(suggestion);
    setIsEmailDropdownClosing(true);
    setTimeout(() => {
      setIsEmailDropdownOpen(false);
      setIsEmailDropdownClosing(false);
    }, 300);
    emailInputRef.current?.focus();
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(event.target as Node) && 
          emailInputRef.current && !emailInputRef.current.contains(event.target as Node)) {
        setIsEmailDropdownOpen(false);
      }
    };

    if (isEmailDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmailDropdownOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Timeout de segurança: máximo 15 segundos para o login (Supabase pode demorar)
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout de segurança ativado após 15 segundos');
      setLoading(false);
      setError('A conexão está demorando muito. Verifique sua internet e tente novamente.');
    }, 15000);

    try {
      console.log('📝 Tentando fazer login...');
      await login(email, password);
      
      // Limpar timeout se login foi bem-sucedido
      clearTimeout(timeoutId);
      console.log('✅ Login bem-sucedido, redirecionando...');
      
      // Redirecionar imediatamente após login bem-sucedido
      // O StoreContext vai carregar a loja automaticamente
      const destination = from === '/admin/dashboard' ? from : '/admin/dashboard';
      
      // Usar window.location como fallback se navigate não funcionar
      try {
        navigate(destination, { replace: true });
        // Se navigate não redirecionar em 1 segundo, forçar com window.location
        setTimeout(() => {
          if (window.location.pathname === '/admin/login') {
            console.log('⚠️ Navigate não funcionou, usando window.location');
            window.location.href = destination;
          }
        }, 1000);
      } catch (navError) {
        console.error('Erro ao navegar:', navError);
        window.location.href = destination;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('❌ Erro no handleSubmit:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Painel Administrativo</h1>
          {store && <p className="store-name">{store.name}</p>}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" ref={emailDropdownRef}>
            <input
              ref={emailInputRef}
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              onFocus={() => {
                if (email.length > 0 && emailSuggestions.length > 0) {
                  setIsEmailDropdownOpen(true);
                }
              }}
              placeholder="Gmail"
              required
              autoComplete="email"
            />
            {isEmailDropdownOpen && emailSuggestions.length > 0 && (
              <div className={`login-email-dropdown ${isEmailDropdownClosing ? 'closing' : ''}`}>
                {emailSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="login-email-suggestion"
                    onClick={() => handleEmailSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group form-group-password">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Senha"
              required
              autoComplete="current-password"
              className="login-input-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <img
                src={showPassword ? hideIcon : showIcon}
                alt={showPassword ? "Esconder senha" : "Mostrar senha"}
                className="password-toggle-icon"
              />
            </button>
          </div>

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Não tem uma conta?{' '}
            <a href="/admin/register">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  );
}

