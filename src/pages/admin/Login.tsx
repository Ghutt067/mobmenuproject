import { useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import './Login.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [isEmailDropdownClosing, setIsEmailDropdownClosing] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

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

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
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
            <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m19 20.5h-14a4.00427 4.00427 0 0 1 -4-4v-9a4.00427 4.00427 0 0 1 4-4h14a4.00427 4.00427 0 0 1 4 4v9a4.00427 4.00427 0 0 1 -4 4zm-14-15a2.00229 2.00229 0 0 0 -2 2v9a2.00229 2.00229 0 0 0 2 2h14a2.00229 2.00229 0 0 0 2-2v-9a2.00229 2.00229 0 0 0 -2-2z" fill="currentColor"/>
              <path d="m12 13.43359a4.99283 4.99283 0 0 1 -3.07031-1.0542l-6.544-5.08984a1.00035 1.00035 0 0 1 1.22852-1.5791l6.54394 5.08984a2.99531 2.99531 0 0 0 3.6836 0l6.54394-5.08984a1.00035 1.00035 0 0 1 1.22852 1.5791l-6.544 5.08984a4.99587 4.99587 0 0 1 -3.07021 1.0542z" fill="currentColor"/>
            </svg>
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
              className="login-input-with-icon"
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

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Senha"
              required
              autoComplete="current-password"
            />
          </div>

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
      </div>
    </div>
  );
}

