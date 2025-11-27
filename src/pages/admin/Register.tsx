import { useState, useEffect, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import showIcon from '../../icons/show.svg';
import hideIcon from '../../icons/hide.svg';
import './Register.css';

export default function AdminRegister() {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [isEmailDropdownClosing, setIsEmailDropdownClosing] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'storeName') {
      setStoreName(value);
    } else if (name === 'ownerName') {
      setOwnerName(value);
    } else if (name === 'email') {
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
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 0. Verificar se o email já está em uso
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Este email já está cadastrado. Se você excluiu o usuário, pode levar alguns minutos para o sistema atualizar. Tente novamente em instantes ou use outro email.');
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Tratar erro específico de usuário já registrado
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered') ||
            authError.message.includes('already exists')) {
          throw new Error('Este email já está cadastrado. Por favor, faça login ou use outro email. Se você excluiu o usuário, aguarde alguns minutos e tente novamente.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário.');
      }

      // 1.5. Garantir que o usuário está autenticado antes de inserir dados
      console.log('Usuário criado:', authData.user?.id);
      console.log('Sessão inicial:', authData.session ? 'Existe' : 'Não existe');
      
      // Verificar se já há sessão do signUp
      let session = authData.session;
      let currentUser = authData.user;
      
      // Se não houver sessão, tentar múltiplas estratégias
      if (!session) {
        console.log('Sessão não encontrada, tentando autenticar...');
        
        // Estratégia 1: Aguardar e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck?.session) {
          session = sessionCheck.session;
          console.log('Sessão encontrada após espera');
        } else {
          console.log('Sessão ainda não encontrada, tentando signIn...');
        }
        
        // Estratégia 2: Fazer signIn explícito
        if (!session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            console.error('Erro no signIn:', signInError);
            // Aguardar mais um pouco e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session) {
              session = retrySession.session;
              console.log('Sessão encontrada após retry');
            } else {
              throw new Error(`Erro ao autenticar: ${signInError.message}. Verifique se a confirmação de email está DESABILITADA no Supabase Dashboard > Authentication > Settings.`);
            }
          } else {
            session = signInData.session;
            currentUser = signInData.user;
            console.log('Sessão criada via signIn');
          }
        }
      }
      
      // Verificação final: usar o usuário que foi criado, mesmo sem sessão
      // Se o usuário foi criado, podemos usar o ID dele diretamente
      if (!currentUser && authData.user) {
        currentUser = authData.user;
        console.log('Usando usuário do signUp:', currentUser.id);
      }

      // Se ainda não temos usuário, tentar buscar
      if (!currentUser) {
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Erro ao buscar usuário:', userError);
          // Mesmo com erro, se temos o ID do signUp, podemos continuar
          if (authData.user?.id) {
            currentUser = authData.user;
            console.log('Usando usuário do signUp apesar do erro getUser:', currentUser.id);
          } else {
            throw new Error('Não foi possível identificar o usuário. Tente novamente.');
          }
        } else if (fetchedUser) {
          currentUser = fetchedUser;
          console.log('Usuário obtido via getUser:', currentUser.id);
        }
      }

      // Verificação final: precisamos do ID do usuário
      if (!currentUser || !currentUser.id) {
        throw new Error('Não foi possível obter o ID do usuário. O usuário foi criado, mas não foi possível autenticá-lo. Tente fazer login manualmente.');
      }

      console.log('✅ Usuário identificado:', currentUser.id);
      console.log('✅ Sessão:', session ? 'Ativa' : 'Não ativa');

      // CRÍTICO: Garantir que temos sessão ativa antes de criar a loja (RLS precisa)
      if (!session) {
        console.log('⚠️ Sessão não encontrada, fazendo signIn forçado...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('Erro no signIn forçado:', signInError);
          throw new Error(`Não foi possível autenticar o usuário: ${signInError.message}. O usuário foi criado, mas é necessário fazer login manualmente.`);
        }
        
        if (!signInData.session) {
          throw new Error('Sessão não foi criada após signIn. Tente fazer login manualmente.');
        }
        
        session = signInData.session;
        console.log('✅ Sessão criada via signIn forçado');
      }

      // Verificação final: garantir que temos sessão e usuário
      if (!session) {
        throw new Error('Não foi possível estabelecer sessão. O usuário foi criado, mas é necessário fazer login manualmente em /admin/login');
      }

      if (!currentUser || !currentUser.id) {
        throw new Error('Não foi possível identificar o usuário.');
      }

      console.log('✅ Usuário autenticado:', currentUser.id);
      console.log('✅ Sessão ativa:', session ? 'Sim' : 'Não');
      console.log('✅ Token de acesso:', session?.access_token ? 'Existe' : 'Não existe');
      
      // Verificação final antes de criar loja
      if (!session || !session.access_token) {
        throw new Error('Sessão inválida. Não foi possível obter token de acesso. Tente fazer login manualmente.');
      }

      // Verificar se a sessão está realmente ativa (sem chamar getUser que pode falhar)
      if (!session.user) {
        // Se não temos user na sessão, usar o currentUser que já temos
        console.log('⚠️ Sessão não tem user, usando currentUser:', currentUser.id);
      } else {
        console.log('✅ Sessão tem user:', session.user.id);
        // Atualizar currentUser com o user da sessão (mais confiável)
        currentUser = session.user;
      }
      
      console.log('✅ Criando loja para usuário:', currentUser.id);
      console.log('✅ Token da sessão:', session.access_token ? 'Existe (' + session.access_token.substring(0, 20) + '...)' : 'NÃO EXISTE');

      // Verificar se estamos realmente autenticados fazendo uma query simples
      const { error: testError } = await supabase
        .from('stores')
        .select('id')
        .limit(0);
      
      if (testError && testError.code === 'PGRST301') {
        console.log('⚠️ Teste de autenticação: RLS pode estar bloqueando');
      } else {
        console.log('✅ Teste de autenticação: OK');
      }

      // 2. Criar loja na tabela stores
      const slug = generateSlug(storeName);
      
      console.log('📝 Dados da loja a criar:', {
        name: storeName,
        slug: slug,
        owner_email: email,
        owner_name: ownerName,
        subscription_status: 'active'
      });
      
      // Usar a sessão que já temos (não buscar novamente com getSession)
      // A sessão já foi verificada anteriormente e está em 'session'
      if (!session || !session.access_token) {
        console.error('❌ Sessão perdida antes de inserir!');
        throw new Error('Sessão não encontrada. Por favor, faça login novamente.');
      }
      
      console.log('✅ Usando sessão existente para inserir loja');
      console.log('  - User ID:', currentUser.id);
      console.log('  - Token presente:', session.access_token ? 'Sim' : 'Não');
      
      // Tentar inserir a loja
      let storeData;
      let storeError;
      
      // Primeira tentativa: usar função SQL (bypass RLS)
      console.log('🔄 Tentando inserir usando função SQL...');
      const { data: functionResult, error: functionError } = await supabase
        .rpc('insert_store', {
          p_name: storeName,
          p_slug: slug,
          p_owner_email: email,
          p_owner_name: ownerName
        });
      
      if (functionError) {
        console.log('⚠️ Função SQL falhou, tentando inserção direta...');
        console.error('Erro da função:', functionError);
        
        // Fallback: tentar inserção direta
        const insertResult = await supabase
          .from('stores')
          .insert({
            name: storeName,
            slug: slug,
            owner_email: email,
            owner_name: ownerName,
            subscription_status: 'active',
          })
          .select()
          .single();
        
        storeData = insertResult.data;
        storeError = insertResult.error;
      } else {
        // Função SQL funcionou!
        console.log('✅ Função SQL executada com sucesso!');
        // Buscar a loja criada
        const { data: createdStore, error: fetchError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', functionResult)
          .single();
        
        if (fetchError) {
          storeError = fetchError;
        } else {
          storeData = createdStore;
          storeError = null;
        }
      }
      
      // Log detalhado do erro
      if (storeError) {
        console.error('🔍 DETALHES DO ERRO DE INSERÇÃO:');
        console.error('  - Código:', storeError.code);
        console.error('  - Mensagem:', storeError.message);
        console.error('  - Detalhes:', storeError.details);
        console.error('  - Hint:', storeError.hint);
        console.error('  - Status HTTP:', (storeError as any).status);
        console.error('  - Sessão ativa:', session ? 'Sim' : 'Não');
        console.error('  - Token presente:', session?.access_token ? 'Sim' : 'Não');
      }

      // Se der erro de RLS, tentar novamente após garantir sessão
      if (storeError && (storeError.code === '42501' || storeError.message.includes('row-level security'))) {
        console.log('⚠️ Erro RLS detectado, tentando reautenticar...');
        
        // Fazer signIn novamente para garantir sessão fresca
        const { data: freshSignIn, error: freshError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (freshError) {
          console.error('❌ Erro ao reautenticar:', freshError);
        } else if (freshSignIn.session) {
          console.log('✅ Reautenticação bem-sucedida, tentando inserir novamente...');
          
          // Tentar inserir novamente com sessão fresca
          const retryResult = await supabase
            .from('stores')
            .insert({
              name: storeName,
              slug: slug,
              owner_email: email,
              owner_name: ownerName,
              subscription_status: 'active',
            })
            .select()
            .single();
          
          storeData = retryResult.data;
          storeError = retryResult.error;
        }
      }

      if (storeError) {
        console.error('❌ Erro ao criar loja:', storeError);
        console.error('Código do erro:', storeError.code);
        console.error('Mensagem:', storeError.message);
        console.error('Detalhes:', storeError.details);
        console.error('Hint:', storeError.hint);
        console.error('Status HTTP:', (storeError as any).status);
        
        // Não fazer logout ainda, vamos tentar diagnosticar
        
        // Se for erro de RLS, dar instruções claras
        if (storeError.message.includes('row-level security') || 
            storeError.message.includes('RLS') ||
            storeError.code === '42501') {
          
          console.error('🔍 DIAGNÓSTICO RLS:');
          console.error('1. Execute o script "SOLUCAO-RLS-DEFINITIVA-FINAL.sql" no Supabase SQL Editor');
          console.error('2. Verifique se as 3 políticas INSERT foram criadas (stores, admin_users, store_customizations)');
          console.error('3. Verifique se RLS está habilitado nas 3 tabelas');
          console.error('4. Limpe o cache do navegador (Ctrl+Shift+Del) e tente novamente');
          
          await supabase.auth.signOut();
          throw new Error(`ERRO RLS: As políticas estão bloqueando. Código: ${storeError.code}. Execute o script "SOLUCAO-RLS-DEFINITIVA-FINAL.sql" no Supabase SQL Editor. Este script remove TODAS as políticas antigas e cria novas com nomes simples.`);
        }
        
        await supabase.auth.signOut();
        throw new Error(`Erro ao criar loja: ${storeError.message}. Código: ${storeError.code || 'N/A'}`);
      }

      // 3. Criar registro na tabela admin_users usando função SQL
      console.log('🔄 Tentando inserir admin_user usando função SQL...');
      const { error: adminFunctionError } = await supabase
        .rpc('insert_admin_user', {
          p_user_id: authData.user.id,
          p_store_id: storeData.id,
          p_email: email,
          p_role: 'owner'
        });

      let adminError = null;
      
      if (adminFunctionError) {
        console.log('⚠️ Função SQL falhou, tentando inserção direta...');
        console.error('Erro da função:', adminFunctionError);
        
        // Fallback: tentar inserção direta
        const { error: directAdminError } = await supabase
          .from('admin_users')
          .insert({
            id: authData.user.id,
            store_id: storeData.id,
            email: email,
            role: 'owner',
          });
        
        adminError = directAdminError;
      } else {
        console.log('✅ Função SQL para admin_user executada com sucesso!');
      }

      if (adminError) {
        // Se erro ao criar admin_user, deletar loja e fazer logout
        await supabase.from('stores').delete().eq('id', storeData.id);
        await supabase.auth.signOut();
        throw adminError;
      }

      // 4. Criar customizações padrão usando função SQL
      console.log('🔄 Tentando inserir customizações usando função SQL...');
      const { error: customizationsError } = await supabase
        .rpc('insert_store_customizations', {
          p_store_id: storeData.id
        });

      if (customizationsError) {
        console.log('⚠️ Função SQL falhou, tentando inserção direta...');
        console.error('Erro da função:', customizationsError);
        
        // Fallback: tentar inserção direta
        await supabase
          .from('store_customizations')
          .insert({
            store_id: storeData.id,
            promo_banner_visible: true,
            promo_banner_text: 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
            promo_banner_bg_color: '#FDD8A7',
            promo_banner_text_color: '#000000',
            promo_banner_use_gradient: true,
            primary_color: '#FF6B35',
            secondary_color: '#004E89',
            background_color: '#FFFFFF',
            text_color: '#000000',
            show_search: true,
            show_menu: true,
            show_cart: true,
          });
      } else {
        console.log('✅ Função SQL para customizações executada com sucesso!');
      }

      // 5. Fazer logout e redirecionar para login com o slug da loja
      await supabase.auth.signOut();
      
      navigate(`/admin/login?store=${slug}`, { 
        state: { 
          message: 'Cadastro realizado com sucesso! Faça login para continuar.',
          email 
        } 
      });
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Criar Conta</h1>
          <p className="register-subtitle">Cadastre sua loja e comece a vender</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <svg className="register-input-icon" width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m44.2421875 16.5478516-2.5244141-7.2978516c-.6513672-1.8828125-2.4277344-3.1479492-4.4199219-3.1479492h-26.555664c-1.9921875 0-3.7685547 1.2651367-4.4199219 3.1479492l-2.5244141 7.2978516c-.5996094 1.7329102-.3925781 3.5.5668945 4.847168.9858398 1.3842773 2.6660156 2.1777344 4.6098633 2.1777344 1.90625 0 3.8183594-.7636719 5.2905273-2.0429688 1.1367188 1.2729492 2.84375 2.0429688 4.7397461 2.0429688 1.9174805 0 3.71875-.7607422 5.0151367-2.0415039 1.2963867 1.2807617 3.0981445 2.0415039 5.0151367 2.0415039 1.8964844 0 3.6035156-.7700195 4.7402344-2.0429688 1.2123413 1.053894 2.7244873 1.7496948 4.2851563 1.9650269v12.6575317c0 1.5078125-1.2275391 2.7353516-2.7363281 2.7353516h-5.2294922v-6.7148438c0-3.203125-2.6054688-5.8085938-5.809082-5.8085938h-.4399414c-3.203125 0-5.809082 2.6054688-5.809082 5.8085938v6.7148438h-5.3212891c-1.5083008 0-2.7358398-1.2275391-2.7358398-2.7353516v-8.9248047c0-.828125-.6713867-1.5-1.5-1.5s-1.5.671875-1.5 1.5v8.9248047c0 3.1621094 2.5732422 5.7353516 5.7358398 5.7353516h6.8212891 9.0581055 6.7294922c3.1630859 0 5.7363281-2.5732422 5.7363281-5.7353516v-12.8878785c1.078186-.3503418 1.987793-.9891968 2.6152344-1.8694458.9589843-1.3476562 1.1660156-3.1142578.5664062-4.8471679zm-23.2055664 22.3398437v-6.7148438c0-1.5488281 1.2602539-2.8085938 2.809082-2.8085938h.4399414c1.5493164 0 2.809082 1.2597656 2.809082 2.8085938v6.7148438zm20.1948242-19.2329101c-.421875.5917969-1.1904297.9179688-2.1660156.9179688-1.6357422 0-3.3535156-.9648438-4.2744141-2.4013672-.2783203-.434082-.7558594-.6904297-1.2626953-.6904297-.0683594 0-.1367188.0048828-.2060547.0141602-.5800781.0805664-1.0595703.4907227-1.2294922 1.0507813-.3730469 1.2314453-1.5732422 2.0268555-3.0576172 2.0268555-1.5585938 0-3.0283203-.8969727-3.6582031-2.2319336-.2480469-.5249023-.7763672-.8598633-1.3569336-.8598633s-1.1088867.3349609-1.3564453.8598633c-.6303711 1.3349609-2.1005859 2.2319336-3.6586914 2.2319336-1.4838867 0-2.684082-.7958984-3.0576172-2.0268555-.1699219-.5600586-.6499023-.9702148-1.2294922-1.0507813-.5810547-.0771484-1.1533203.184082-1.4692383.6767578-.9199219 1.4360352-2.6376953 2.4008789-4.2739258 2.4008789-.9750977 0-1.7446289-.3261719-2.1665039-.9179688-.3950195-.5551758-.4575195-1.3100586-.175293-2.1264648l2.5244141-7.2973633c.2338867-.675293.8706055-1.1289063 1.5849609-1.1289063h26.5556641c.7138672 0 1.3505859.4536133 1.5839844 1.128418l2.5244141 7.2983398c.2832031.815918.2207031 1.5708008-.1748047 2.1259766z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              id="storeName"
              name="storeName"
              value={storeName}
              onChange={handleInputChange}
              placeholder="Nome da loja"
              required
              autoComplete="organization"
              className="register-input-with-icon"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={ownerName}
              onChange={handleInputChange}
              placeholder="Seu nome"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group" ref={emailDropdownRef}>
            <svg className="register-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              className="register-input-with-icon"
            />
            {isEmailDropdownOpen && emailSuggestions.length > 0 && (
              <div className={`register-email-dropdown ${isEmailDropdownClosing ? 'closing' : ''}`}>
                {emailSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="register-email-suggestion"
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
              autoComplete="new-password"
              minLength={6}
              className="register-input-password"
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

          <div className="form-group">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirmar senha"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Já tem uma conta?{' '}
            <a href="/admin/login">Fazer login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

