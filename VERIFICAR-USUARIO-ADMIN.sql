-- ============================================
-- VERIFICAR USUÁRIO ADMIN - DIAGNÓSTICO
-- ============================================
-- Execute este script substituindo o email
-- pelo email do usuário que está tendo problemas
-- ============================================

-- Substitua este email pelo email do usuário
\set email 'kotthz@proton.me'

-- 1. Verificar se o usuário existe em auth.users
SELECT 
    'auth.users' as tabela,
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado'
        ELSE '✅ Email confirmado'
    END as status_email
FROM auth.users
WHERE email = :'email';

-- 2. Verificar se o usuário existe em admin_users
SELECT 
    'admin_users' as tabela,
    id,
    email,
    store_id,
    role,
    created_at,
    CASE 
        WHEN id IS NULL THEN '❌ NÃO encontrado'
        ELSE '✅ Encontrado'
    END as status
FROM admin_users
WHERE email = :'email';

-- 3. Verificar se há loja associada
SELECT 
    'stores' as tabela,
    s.id as store_id,
    s.name as store_name,
    s.owner_email,
    s.subscription_status,
    s.created_at,
    CASE 
        WHEN s.id IS NULL THEN '❌ Nenhuma loja encontrada'
        ELSE '✅ Loja encontrada'
    END as status
FROM stores s
WHERE s.owner_email = :'email'
   OR s.id IN (
       SELECT store_id 
       FROM admin_users 
       WHERE email = :'email'
   );

-- 4. Verificar políticas RLS da tabela admin_users
SELECT 
    policyname,
    cmd as operacao,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
        ELSE 'Sem condição USING'
    END as condicao_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
        ELSE 'Sem condição WITH CHECK'
    END as condicao_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'admin_users'
ORDER BY policyname;

-- 5. Testar se o usuário pode ler seus próprios dados (simulação)
-- NOTA: Isso só funciona se você estiver logado como o usuário
-- Execute isso no contexto de uma sessão autenticada
DO $$
DECLARE
    user_id uuid;
    admin_count int;
BEGIN
    -- Tentar encontrar o ID do usuário
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = :'email';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário não encontrado em auth.users';
    ELSE
        RAISE NOTICE '✅ Usuário encontrado em auth.users: %', user_id;
        
        -- Verificar se existe em admin_users
        SELECT COUNT(*) INTO admin_count
        FROM admin_users
        WHERE id = user_id;
        
        IF admin_count = 0 THEN
            RAISE NOTICE '❌ Usuário NÃO encontrado em admin_users';
            RAISE NOTICE '💡 SOLUÇÃO: Execute o script para inserir o usuário em admin_users';
        ELSE
            RAISE NOTICE '✅ Usuário encontrado em admin_users';
        END IF;
    END IF;
END $$;

-- 6. Se o usuário não existir em admin_users, mostrar como inserir
-- (Execute apenas se necessário)
/*
-- PRIMEIRO: Obtenha o user_id e store_id executando as queries acima
-- DEPOIS: Execute este INSERT (substitua os valores)

INSERT INTO admin_users (id, email, store_id, role)
SELECT 
    u.id,
    u.email,
    s.id as store_id,
    'admin' as role
FROM auth.users u
LEFT JOIN stores s ON s.owner_email = u.email
WHERE u.email = :'email'
  AND NOT EXISTS (
      SELECT 1 FROM admin_users au WHERE au.id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    store_id = EXCLUDED.store_id,
    role = EXCLUDED.role;
*/



