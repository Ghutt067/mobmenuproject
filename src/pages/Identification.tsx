import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSearch } from '../contexts/SearchContext';
import { useStoreNavigation } from '../hooks/useStoreNavigation';
import { getAllProducts, type Product } from '../services/productService';
import { getProductImage } from '../utils/imageHelper';
import { formatPrice } from '../utils/priceFormatter';
import logoImage from '../assets/fequeijaologo.png';
import { useStore } from '../contexts/StoreContext';
import basketIcon from '../icons/basket-svgrepo-com.svg';
import backIcon from '../icons/backicon.svg';
import woodenTableImage from '../assets/empty-wooden-table-top-isolated-white-background-used-display-montage-your-products.png';
import './Identification.css';

function Identification() {
  const { navigate } = useStoreNavigation();
  const { cartItems, getItemQuantity } = useCart();
  const { isSearchOpen, setIsSearchOpen, setSearchTerm } = useSearch();
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const cepInputRef = useRef<HTMLInputElement>(null);
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [isEmailDropdownClosing, setIsEmailDropdownClosing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    hasNoNumber: false,
    neighborhood: '',
    complement: '',
    city: '',
    state: ''
  });
  const [selectedShipping, setSelectedShipping] = useState<string | null>('free');
  const [showPayment, setShowPayment] = useState(false);
  const [isIdentificationHidden, setIsIdentificationHidden] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [cepData, setCepData] = useState<any>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [isCepLinkVisible, setIsCepLinkVisible] = useState(true);

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

  // Garantir que a página sempre abre no topo
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }
    };
    fetchProducts();
  }, []);

  // Preencher cidade e estado com os dados da loja
  useEffect(() => {
    if (store?.city && store?.state) {
      setFormData(prev => ({
        ...prev,
        city: store.city || prev.city,
        state: store.state || prev.state
      }));
    }
  }, [store?.city, store?.state]);

  // Calcular total do carrinho
  const cartTotal = useMemo(() => {
    if (cartItems.length === 0) {
      return '0,00';
    }
    let total = 0;
    cartItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // Remove R$, espaços e converte vírgula para ponto
        const priceStr = product.newPrice.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
        const price = parseFloat(priceStr) || 0;
        total += price * item.quantity;
      }
    });
    // Formata o total com 2 casas decimais e vírgula como separador decimal
    return total.toFixed(2).replace('.', ',');
  }, [cartItems, products]);

  // Função para formatar telefone visualmente
  const formatPhone = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica formatação
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      // Telefone fixo: XX XXXX-XXXX
      return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      // Celular: XX XXXXX-XXXX
      return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  // Função para formatar CPF visualmente
  const formatCPF = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica formatação: XXX.XXX.XXX-XX
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
    }
  };

  // Função para formatar CEP visualmente
  const formatCEP = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Aplica formatação: XXXXX-XXX
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
  };

  // Função para buscar CEP na API ViaCEP
  const fetchCEP = async (cep: string) => {
    if (cep.length !== 8) return;
    
    setIsLoadingCep(true);
    setCepError(false);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setCepError(true);
        setCepData(null);
        setIsCepLinkVisible(true);
      } else {
        // Iniciar fade-out do link
        setIsCepLinkVisible(false);
        // Aguardar animação antes de definir os dados
        setTimeout(() => {
          setCepData(data);
          setCepError(false);
          // Preencher automaticamente os campos de endereço
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
        }, 300);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError(true);
      setCepData(null);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Tratamento especial para nome completo - apenas letras e espaços
    if (name === 'fullName') {
      // Remove tudo que não é letra ou espaço
      const lettersOnly = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: lettersOnly
      }));
      return;
    }
    
    // Tratamento especial para telefone
    if (name === 'phone') {
      // Remove tudo que não é número
      const numbers = value.replace(/\D/g, '');
      // Limita a 11 dígitos
      const limitedNumbers = numbers.slice(0, 11);
      // Salva apenas números no formData
      setFormData(prev => ({
        ...prev,
        [name]: limitedNumbers
      }));
      return;
    }

    // Tratamento especial para CPF
    if (name === 'cpf') {
      // Remove tudo que não é número
      const numbers = value.replace(/\D/g, '');
      // Limita a 11 dígitos
      const limitedNumbers = numbers.slice(0, 11);
      // Salva apenas números no formData
      setFormData(prev => ({
        ...prev,
        [name]: limitedNumbers
      }));
      return;
    }

    // Tratamento especial para CEP
    if (name === 'cep') {
      // Remove tudo que não é número
      const numbers = value.replace(/\D/g, '');
      // Limita a 8 dígitos
      const limitedNumbers = numbers.slice(0, 8);
      // Salva apenas números no formData
      setFormData(prev => ({
        ...prev,
        [name]: limitedNumbers
      }));
      
      // Buscar CEP quando tiver 8 dígitos
      if (limitedNumbers.length === 8) {
        fetchCEP(limitedNumbers);
        // Fazer blur para esconder o teclado do celular
        setTimeout(() => {
          cepInputRef.current?.blur();
        }, 100);
      } else {
        // Limpar dados do CEP se não tiver 8 dígitos
        setCepData(null);
        setCepError(false);
        setIsCepLinkVisible(true);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mostrar dropdown de sugestões de e-mail quando estiver digitando
    if (name === 'email' && value.length > 0 && !value.includes('@')) {
      setIsEmailDropdownOpen(true);
    } else if (name === 'email' && value.includes('@')) {
      // Se já tem @, verificar se precisa mostrar sugestões
      const [localPart, domainPart] = value.split('@');
      if (localPart && domainPart && domainPart.length > 0) {
        setIsEmailDropdownOpen(true);
      } else if (localPart && !domainPart) {
        setIsEmailDropdownOpen(true);
      } else {
        setIsEmailDropdownOpen(false);
      }
    } else if (name === 'email' && value.length === 0) {
      setIsEmailDropdownOpen(false);
    }
  };

  // Calcular sugestões de e-mail
  const emailSuggestions = useMemo(() => {
    if (!formData.email || formData.email.length === 0) {
      return [];
    }

    const emailValue = formData.email.toLowerCase();
    
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
  }, [formData.email]);

  // Fechar dropdown automaticamente quando o email corresponder exatamente a uma sugestão
  useEffect(() => {
    if (formData.email && emailSuggestions.length > 0 && isEmailDropdownOpen) {
      const emailLower = formData.email.toLowerCase();
      const exactMatch = emailSuggestions.some(suggestion => suggestion.toLowerCase() === emailLower);
      if (exactMatch) {
        // Iniciar animação de fade-out
        setIsEmailDropdownClosing(true);
        // Fechar após a animação
        setTimeout(() => {
          setIsEmailDropdownOpen(false);
          setIsEmailDropdownClosing(false);
        }, 300);
      }
    }
  }, [formData.email, emailSuggestions, isEmailDropdownOpen]);

  const handleEmailSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      email: suggestion
    }));
    // Iniciar animação de fade-out
    setIsEmailDropdownClosing(true);
    // Fechar após a animação
    setTimeout(() => {
      setIsEmailDropdownOpen(false);
      setIsEmailDropdownClosing(false);
    }, 300);
    emailInputRef.current?.focus();
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setIsCartDropdownOpen(false);
      }
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(event.target as Node) && 
          emailInputRef.current && !emailInputRef.current.contains(event.target as Node)) {
        setIsEmailDropdownOpen(false);
      }
    };

    if (isCartDropdownOpen || isEmailDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartDropdownOpen, isEmailDropdownOpen]);

  // Filtrar produtos que estão no carrinho e ordenar pela ordem de adição
  const cartProducts = useMemo(() => {
    // Ordenar pela ordem em que foram adicionados ao carrinho
    const orderedProducts = cartItems
      .map((cartItem) => {
        const product = products.find((p) => p.id === cartItem.productId);
        return product;
      })
      .filter((product): product is Product => product !== undefined);
    
    return orderedProducts;
  }, [products, cartItems]);

  const handleBackClick = () => {
    if (showPayment) {
      // Se está na página de pagamento, fazer transição inversa
      setShowPayment(false);
    } else {
      // Se está na página de identificação, voltar para sacola
      navigate('/sacola');
    }
  };

  const handleCartLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartDropdownOpen(!isCartDropdownOpen);
  };

  // Validar se todos os campos estão preenchidos
  const isFormValid = useMemo(() => {
    const checkoutTheme = store?.customizations?.checkoutTheme || 'ecommerce';
    const isLocalTheme = checkoutTheme === 'local';
    
    // Validar se os campos estão completamente preenchidos
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    const cepNumbers = formData.cep.replace(/\D/g, '');
    
    // Validar email com formato básico
    const emailValid = formData.email.trim() !== '' && 
                      formData.email.includes('@') && 
                      formData.email.includes('.') &&
                      !formData.email.endsWith('@') &&
                      !formData.email.endsWith('.');
    
    // Validação baseada no tema
    if (isLocalTheme) {
      // Tema Local: validação simplificada sem CEP
      const basicFieldsValid = (
        formData.fullName.trim() !== '' &&
        emailValid &&
        phoneNumbers.length >= 10 && // Telefone deve ter pelo menos 10 dígitos
        cpfNumbers.length === 11 // CPF deve ter exatamente 11 dígitos
      );
      
      const addressValid = (
        formData.street.trim() !== '' &&
        (formData.number.trim() !== '' || formData.hasNoNumber) &&
        formData.neighborhood.trim() !== '' &&
        formData.city.trim() !== '' &&
        formData.state.trim().length === 2 // Estado deve ter 2 caracteres
      );
      
      return basicFieldsValid && addressValid;
    } else {
      // Tema Ecommerce: validação completa com CEP
      const basicFieldsValid = (
        formData.fullName.trim() !== '' &&
        emailValid &&
        phoneNumbers.length >= 10 && // Telefone deve ter pelo menos 10 dígitos
        cpfNumbers.length === 11 && // CPF deve ter exatamente 11 dígitos
        cepNumbers.length === 8 && // CEP deve ter exatamente 8 dígitos
        cepData !== null && // CEP deve ter sido encontrado
        !cepError // CEP não deve ter erro
      );
      
      // Se CEP foi encontrado, validar campos de endereço e frete
      if (cepData && !cepError) {
        const addressValid = (
          (formData.number.trim() !== '' || formData.hasNoNumber) &&
          formData.neighborhood.trim() !== '' &&
          formData.city.trim() !== '' &&
          formData.state.trim() !== '' &&
          selectedShipping !== null
        );
        return basicFieldsValid && addressValid;
      }
      
      return false; // Não é válido se CEP não foi encontrado
    }
  }, [formData, cepData, cepError, selectedShipping, store?.customizations?.checkoutTheme]);

  // Limpar erro de validação quando o formulário se tornar válido
  useEffect(() => {
    if (isFormValid && showValidationError) {
      setShowValidationError(false);
    }
  }, [isFormValid, showValidationError]);

  // Remover erro de validação após 8 segundos
  useEffect(() => {
    if (showValidationError) {
      const timer = setTimeout(() => {
        setShowValidationError(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showValidationError]);

  // Rolar para o topo quando a página de pagamento aparecer e esconder seção de identificação após transição
  useEffect(() => {
    if (showPayment) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Esconder a seção de identificação após a transição estar completa (500ms)
      const timer = setTimeout(() => {
        setIsIdentificationHidden(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Mostrar a seção de identificação quando voltar
      setIsIdentificationHidden(false);
    }
  }, [showPayment]);

  const handleContinue = () => {
    // Validar antes de continuar
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    // Limpar erro de validação se existir
    setShowValidationError(false);
    // Validar e enviar dados
    console.log('Continuar para pagamento');
    setShowPayment(true);
    // Rolar para o topo quando mudar para a página de pagamento
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="identification-page">
      {/* Header */}
      <header className="identification-header">
        <div className="identification-header-content">
          <div className="identification-logo">
            <div className="identification-logo-circle">
              <img 
                src={store?.customizations?.profileImageUrl || logoImage} 
                alt={store?.name || "Queijaria do Mineiro"} 
                className="identification-logo-image" 
              />
            </div>
          </div>
          <div className="identification-total" ref={cartDropdownRef}>
            <div className="identification-total-row">
              <div className="identification-total-price">
                <span className="identification-currency">R$</span>
                <span className="identification-value">{cartTotal}</span>
              </div>
              <div className="identification-cart-icon">
                <img src={basketIcon} alt="Carrinho" className="identification-cart-icon-image" />
                {cartItems.length > 0 && (
                  <span className="identification-cart-count">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                )}
              </div>
            </div>
            <div className="identification-cart-row">
              <button 
                className={`identification-cart-link ${isCartDropdownOpen ? 'active' : ''}`}
                onClick={handleCartLinkClick}
                type="button"
              >
                ver carrinho
              </button>
              <span 
                className={`identification-cart-arrow ${isCartDropdownOpen ? 'open' : ''}`}
                onClick={handleCartLinkClick}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            {isCartDropdownOpen && (
              <div className="identification-cart-dropdown">
                {cartProducts.length === 0 ? (
                  <div className="identification-cart-dropdown-empty">
                    <p>Carrinho vazio</p>
                  </div>
                ) : (
                  <>
                    <div className={`identification-cart-dropdown-items ${cartProducts.length > 4 ? 'identification-cart-dropdown-items-masked' : ''}`}>
                      {cartProducts.slice(0, cartProducts.length > 4 ? 5 : cartProducts.length).map((product, index) => {
                        const quantity = getItemQuantity(product.id);
                        const productImage = getProductImage(product.image);
                        const isPartialItem = cartProducts.length > 4 && index === 4;
                        return (
                          <div 
                            key={product.id} 
                            className={`identification-cart-dropdown-item ${isPartialItem ? 'identification-cart-dropdown-item-partial' : ''}`}
                          >
                            <img
                              src={productImage}
                              alt={product.title}
                              className="identification-cart-dropdown-image"
                            />
                            <div className="identification-cart-dropdown-info">
                              <div className="identification-cart-dropdown-title">{product.title}</div>
                              <div className="identification-cart-dropdown-details">
                                <span className="identification-cart-dropdown-price">{formatPrice(product.newPrice)}</span>
                                <span className="identification-cart-dropdown-quantity">Qtd: {quantity}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {cartProducts.length > 4 && (
                      <div className="identification-cart-dropdown-footer">
                        <button 
                          className="identification-cart-dropdown-button"
                          onClick={() => {
                            setIsCartDropdownOpen(false);
                            // Fechar pesquisa se estiver aberta
                            if (isSearchOpen) {
                              setIsSearchOpen(false);
                              setSearchTerm('');
                            }
                            navigate('/sacola');
                          }}
                        >
                          Ver carrinho completo
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="identification-header-divider"></div>

      {/* Progress Indicator */}
      <div className="identification-progress-wrapper">
        <button className="identification-back-icon-btn" onClick={handleBackClick} aria-label="Voltar">
          <img src={backIcon} alt="Voltar" className="identification-back-icon" />
        </button>
        <div className="identification-progress">
          <div 
            className={`identification-step ${!showPayment ? 'identification-step-active' : ''} ${showPayment ? 'identification-step-clickable' : ''}`}
            onClick={showPayment ? () => setShowPayment(false) : undefined}
            style={showPayment ? { cursor: 'pointer' } : undefined}
          >
            <div className="identification-step-number">1</div>
            <div className="identification-step-label">IDENTIFICAÇÃO</div>
          </div>
          <div 
            className={`identification-step ${showPayment ? 'identification-step-active' : ''} ${!showPayment && isFormValid ? 'identification-step-clickable' : ''} ${!showPayment && !isFormValid ? 'identification-step-disabled' : ''}`}
            onClick={!showPayment ? () => {
              if (!isFormValid) {
                setShowValidationError(true);
              } else {
                handleContinue();
              }
            } : undefined}
            style={!showPayment && isFormValid ? { cursor: 'pointer' } : { cursor: 'not-allowed' }}
          >
            <div className="identification-step-number">2</div>
            <div className="identification-step-label">PAGAMENTO</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="identification-content">
        {/* Container para transição */}
        <div className="identification-transition-container">
          {/* Seção de Identificação */}
          {!isIdentificationHidden && (
          <div className={`identification-form-section ${showPayment ? 'slide-out-left' : ''}`}>
            {/* Personal Data Section */}
            <div className="identification-section">
              <div className="identification-section-header">
                <h2 className="identification-section-title">Dados pessoais</h2>
                {showValidationError && !isFormValid && (
                  <span className="identification-validation-error">*Preencha para continuar*</span>
                )}
              </div>

              <div className="identification-form">
                <div className="identification-input-group">
                  <input
                    type="text"
                    name="fullName"
                    className="identification-input"
                    placeholder="Nome completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="identification-input-group" ref={emailDropdownRef}>
                  <svg className="identification-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m19 20.5h-14a4.00427 4.00427 0 0 1 -4-4v-9a4.00427 4.00427 0 0 1 4-4h14a4.00427 4.00427 0 0 1 4 4v9a4.00427 4.00427 0 0 1 -4 4zm-14-15a2.00229 2.00229 0 0 0 -2 2v9a2.00229 2.00229 0 0 0 2 2h14a2.00229 2.00229 0 0 0 2-2v-9a2.00229 2.00229 0 0 0 -2-2z" fill="currentColor"/>
                    <path d="m12 13.43359a4.99283 4.99283 0 0 1 -3.07031-1.0542l-6.544-5.08984a1.00035 1.00035 0 0 1 1.22852-1.5791l6.54394 5.08984a2.99531 2.99531 0 0 0 3.6836 0l6.54394-5.08984a1.00035 1.00035 0 0 1 1.22852 1.5791l-6.544 5.08984a4.99587 4.99587 0 0 1 -3.07021 1.0542z" fill="currentColor"/>
                  </svg>
                  <input
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    className="identification-input identification-input-with-icon"
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (formData.email.length > 0 && emailSuggestions.length > 0) {
                        setIsEmailDropdownOpen(true);
                      }
                    }}
                  />
                  {isEmailDropdownOpen && emailSuggestions.length > 0 && (
                    <div className={`identification-email-dropdown ${isEmailDropdownClosing ? 'closing' : ''}`}>
                      {emailSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="identification-email-suggestion"
                          onClick={() => handleEmailSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="identification-input-group">
                  <svg className="identification-input-icon" width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m24 2h-10c-2.21 0-4 1.79-4 4v5c0 .55.45 1 1 1s1-.45 1-1v-5c0-1.1.9-2 2-2v1c0 1.65 1.35 3 3 3h4c1.65 0 3-1.35 3-3v-1c1.1 0 2 .9 2 2v20c0 1.1-.9 2-2 2h-1c-.55 0-1 .45-1 1s.45 1 1 1h1c2.21 0 4-1.79 4-4v-20c0-2.21-1.79-4-4-4zm-2 3c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1h6z" fill="currentColor"/>
                    <path d="m18.41 22c-.78-.78-2.05-.78-2.83 0l-.59.59-3.59-3.59.59-.59c.78-.78.78-2.05 0-2.83l-2.59-2.59c-.78-.78-2.05-.78-2.83 0l-1.12 1.12c-.94.94-1.46 2.2-1.46 3.54v.69c0 1.34.52 2.59 1.46 3.54l6.66 6.66c.94.94 2.2 1.46 3.54 1.46h.69c1.34 0 2.59-.52 3.54-1.46l1.12-1.12c.78-.78.78-2.05 0-2.83zm.05 5.12c-.56.56-1.33.88-2.12.88h-.69c-.79 0-1.56-.32-2.12-.88l-6.66-6.66c-.56-.56-.88-1.33-.88-2.12v-.69c0-.79.32-1.56.88-2.12l1.12-1.12 2.59 2.59-1.29 1.29c-.39.39-.39 1.02 0 1.41l5 5c.39.39 1.02.39 1.41 0l1.29-1.29 2.59 2.59z" fill="currentColor"/>
                  </svg>
                  <input
                    type="tel"
                    name="phone"
                    className="identification-input identification-input-with-icon"
                    placeholder="DDD + número"
                    value={formatPhone(formData.phone)}
                    onChange={handleInputChange}
                    maxLength={15}
                  />
                </div>

                <div className="identification-input-group">
                  <svg className="identification-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m17 21.75h-10c-4.41 0-5.75-1.34-5.75-5.75v-8c0-4.41 1.34-5.75 5.75-5.75h10c4.41 0 5.75 1.34 5.75 5.75v8c0 4.41-1.34 5.75-5.75 5.75zm-10-18c-3.58 0-4.25.68-4.25 4.25v8c0 3.57.67 4.25 4.25 4.25h10c3.58 0 4.25-.68 4.25-4.25v-8c0-3.57-.67-4.25-4.25-4.25z" fill="currentColor"/>
                    <path d="m19 8.75h-5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h5c.41 0 .75.34.75.75s-.34.75-.75.75z" fill="currentColor"/>
                    <path d="m19 12.75h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75z" fill="currentColor"/>
                    <path d="m19 16.75h-2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.41 0 .75.34.75.75s-.34.75-.75.75z" fill="currentColor"/>
                    <path d="m8.50043 12.0399c-1.41 0-2.56-1.15-2.56-2.55998 0-1.41 1.15-2.56 2.56-2.56s2.55997 1.15 2.55997 2.56c0 1.40998-1.14997 2.55998-2.55997 2.55998zm0-3.61998c-.58 0-1.06.48-1.06 1.06 0 .57998.48 1.05998 1.06 1.05998s1.06-.48 1.06-1.05998c0-.58-.48-1.06-1.06-1.06z" fill="currentColor"/>
                    <path d="m11.9999 17.08c-.38 0-.71-.29-.75-.68-.11-1.08-.98-1.95-2.06999-2.05-.46-.04-.92-.04-1.38 0-1.09.1-1.96.96-2.07 2.05-.04.41-.41.72-.82.67-.41-.04-.71-.41-.67-.82.18-1.8 1.61-3.23 3.42-3.39.55-.05 1.11-.05 1.66 0 1.79999.17 3.23999 1.6 3.41999 3.39.04.41-.26.78-.67.82-.02.01-.05.01-.07.01z" fill="currentColor"/>
                  </svg>
                  <input
                    type="text"
                    name="cpf"
                    className="identification-input identification-input-with-icon"
                    placeholder="CPF"
                    value={formatCPF(formData.cpf)}
                    onChange={handleInputChange}
                    maxLength={14}
                  />
                </div>

                {/* Security Box */}
                <div className="identification-security-box">
                  {cartProducts.length > 0 && (
                    <div className="identification-preparing-text">
                      <span>P</span>
                      <span>r</span>
                      <span>e</span>
                      <span>p</span>
                      <span>a</span>
                      <span>r</span>
                      <span>a</span>
                      <span>n</span>
                      <span>d</span>
                      <span>o</span>
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </div>
                  )}
                  <img 
                    src={woodenTableImage} 
                    alt="Mesa de madeira" 
                    className="identification-security-image"
                  />
                  {cartProducts.length > 0 && (
                    <>
                      {/* Primeiro produto - centro, maior, por cima */}
                      <div className="identification-product-overlay identification-product-center">
                        <img 
                          src={getProductImage(cartProducts[0].image)} 
                          alt={cartProducts[0].title}
                          className="identification-product-image"
                        />
                      </div>
                      {/* Segundo produto - canto direito, menor, por baixo */}
                      {cartProducts.length > 1 && (
                        <div className="identification-product-overlay identification-product-right">
                          <img 
                            src={getProductImage(cartProducts[1].image)} 
                            alt={cartProducts[1].title}
                            className="identification-product-image"
                          />
                        </div>
                      )}
                      {/* Terceiro produto - canto esquerdo, menor, por baixo */}
                      {cartProducts.length > 2 && (
                        <div className="identification-product-overlay identification-product-left">
                          <img 
                            src={getProductImage(cartProducts[2].image)} 
                            alt={cartProducts[2].title}
                            className="identification-product-image"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Renderizar baseado no tema do checkout */}
                {store?.customizations?.checkoutTheme === 'local' ? (
                  /* Tema Local - Formulário Simplificado */
                  <>
                    <div className="identification-input-group">
                      <svg className="identification-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                      </svg>
                      <input
                        type="text"
                        name="street"
                        className="identification-input identification-input-with-icon"
                        placeholder="Endereço completo"
                        value={formData.street}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="identification-address-row">
                      <div className="identification-input-group identification-input-group-number">
                        <input
                          type="text"
                          name="number"
                          className="identification-input"
                          placeholder="Número"
                          value={formData.number}
                          onChange={handleInputChange}
                          disabled={formData.hasNoNumber}
                        />
                        <label className="identification-checkbox-label">
                          <input
                            type="checkbox"
                            name="hasNoNumber"
                            checked={formData.hasNoNumber}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                hasNoNumber: e.target.checked,
                                number: e.target.checked ? '' : prev.number
                              }));
                            }}
                          />
                          <span>S/N</span>
                        </label>
                        {showValidationError && !formData.hasNoNumber && formData.number.trim() === '' && (
                          <div className="identification-field-error">Informe o número</div>
                        )}
                      </div>
                      <div className="identification-input-group identification-input-group-neighborhood">
                        <input
                          type="text"
                          name="neighborhood"
                          className="identification-input"
                          placeholder="Bairro"
                          value={formData.neighborhood}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="identification-input-group">
                      <input
                        type="text"
                        name="complement"
                        className="identification-input"
                        placeholder="Complemento (opcional)"
                        value={formData.complement}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="identification-address-row">
                      <div className="identification-input-group">
                        <input
                          type="text"
                          name="city"
                          className="identification-input"
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="identification-input-group identification-input-group-state">
                        <input
                          type="text"
                          name="state"
                          className="identification-input"
                          placeholder="Estado (UF)"
                          value={formData.state}
                          onChange={handleInputChange}
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Tema Ecommerce - Formulário Completo com CEP */
                  <>
                    <div className="identification-input-group">
                      <input
                        ref={cepInputRef}
                        type="text"
                        name="cep"
                        className={`identification-input ${cepError ? 'identification-input-error' : ''}`}
                        placeholder="CEP"
                        value={formatCEP(formData.cep)}
                        onChange={handleInputChange}
                        maxLength={9}
                      />
                      {isLoadingCep && formData.cep.length === 8 && (
                        <div className="identification-cep-loading">Buscando CEP...</div>
                      )}
                      {cepError && formData.cep.length === 8 && !isLoadingCep && (
                        <div className="identification-cep-error">CEP não encontrado</div>
                      )}
                    </div>
                    {(!cepData || isCepLinkVisible) && (
                      <a 
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php?t" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`identification-cep-link ${!isCepLinkVisible ? 'fade-out' : ''}`}
                      >
                        Não sei meu CEP
                      </a>
                    )}

                    {/* Campos de endereço e frete - aparecem quando CEP é encontrado */}
                    {cepData && !cepError && !isLoadingCep && (
                      <>
                        {/* Opções de Frete */}
                        <div className="identification-shipping-section">
                          <div className="identification-shipping-options">
                            <label className={`identification-shipping-option ${selectedShipping === 'free' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name="shipping"
                                value="free"
                                checked={selectedShipping === 'free'}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                              />
                              <div className="identification-shipping-option-content">
                                <div className="identification-shipping-price">Grátis</div>
                                <div className="identification-shipping-name">Envio por conta da casa!</div>
                                <div className="identification-shipping-time">de 5 à 6 dias úteis</div>
                              </div>
                            </label>
                            <label className={`identification-shipping-option ${selectedShipping === 'express' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name="shipping"
                                value="express"
                                checked={selectedShipping === 'express'}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                              />
                              <div className="identification-shipping-option-content">
                                <div className="identification-shipping-price">R$12,90</div>
                                <div className="identification-shipping-name">Valor do motoboy</div>
                                <div className="identification-shipping-time">de 2 à 3 dias úteis</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Campos de Endereço */}
                        <div className="identification-address-section">
                          <div className="identification-address-field">
                            <svg className="identification-address-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                            </svg>
                            <span className="identification-address-text">{formData.street || 'Rua não informada'}</span>
                          </div>

                          <div className="identification-address-row">
                            <div className="identification-input-group identification-input-group-number">
                              <input
                                type="text"
                                name="number"
                                className="identification-input"
                                placeholder="Número"
                                value={formData.number}
                                onChange={handleInputChange}
                                disabled={formData.hasNoNumber}
                              />
                              <label className="identification-checkbox-label">
                                <input
                                  type="checkbox"
                                  name="hasNoNumber"
                                  checked={formData.hasNoNumber}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      hasNoNumber: e.target.checked,
                                      number: e.target.checked ? '' : prev.number
                                    }));
                                  }}
                                />
                                <span>S/N</span>
                              </label>
                              {showValidationError && !formData.hasNoNumber && formData.number.trim() === '' && (
                                <div className="identification-field-error">Informe o número</div>
                              )}
                            </div>
                            <div className="identification-input-group identification-input-group-neighborhood">
                              <input
                                type="text"
                                name="neighborhood"
                                className="identification-input"
                                placeholder="Bairro"
                                value={formData.neighborhood}
                                onChange={handleInputChange}
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="identification-input-group">
                            <input
                              type="text"
                              name="complement"
                              className="identification-input"
                              placeholder="Complemento"
                              value={formData.complement}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="identification-address-row">
                            <div className="identification-input-group">
                              <input
                                type="text"
                                name="city"
                                className="identification-input"
                                placeholder="Cidade"
                                value={formData.city}
                                onChange={handleInputChange}
                                readOnly
                              />
                            </div>
                            <div className="identification-input-group identification-input-group-state">
                              <input
                                type="text"
                                name="state"
                                className="identification-input"
                                placeholder="Estado"
                                value={formData.state}
                                onChange={handleInputChange}
                                maxLength={2}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
          )}

          {/* Seção de Pagamento */}
          <div className={`payment-section ${showPayment ? 'slide-in-right' : ''}`}>
            <div className="payment-section-content">
              <div className="payment-section-header">
                <h2 className="payment-section-title">Forma de pagamento</h2>
              </div>

              <div className="payment-options">
                <button className="payment-option payment-option-pix">
                  <div className="payment-option-content">
                    <span className="payment-option-label">PIX</span>
                  </div>
                </button>

                <button className="payment-option payment-option-credit">
                  <div className="payment-option-content">
                    <span className="payment-option-label">CRÉDITO</span>
                  </div>
                </button>

                <button className="payment-option payment-option-debit">
                  <div className="payment-option-content">
                    <span className="payment-option-label">DÉBITO</span>
                  </div>
                </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
          <div className={`identification-actions ${showPayment ? 'slide-out-left' : ''}`}>
          <button 
            className={`identification-btn-continue ${!isFormValid ? 'identification-btn-continue-disabled' : ''}`}
            onClick={handleContinue}
            disabled={!isFormValid}
          >
            Continuar
          </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Identification;

