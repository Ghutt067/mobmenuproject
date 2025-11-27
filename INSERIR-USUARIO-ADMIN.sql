-- ============================================
-- INSERIR USUÁRIO EM admin_users
-- ============================================
-- Execute este script se o usuário existe em
-- auth.users mas não existe em admin_users
-- ============================================

-- Substitua este email pelo email do usuário
\set email 'kotthz@proton.me'

-- 1. Verificar se o usuário existe em auth.users
DO $$
DECLARE
    user_record RECORD;
    store_record RECORD;
    admin_exists BOOLEAN;
BEGIN
    -- Buscar usuário em auth.users
    SELECT id, email INTO user_record
    FROM auth.users
    WHERE email = :'email';
    
    IF user_record.id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado em auth.users. O usuário precisa fazer login primeiro.';
    END IF;
    
    RAISE NOTICE '✅ Usuário encontrado em auth.users:';
    RAISE NOTICE '   ID: %', user_record.id;
    RAISE NOTICE '   Email: %', user_record.email;
    
    -- Verificar se já existe em admin_users
    SELECT EXISTS(SELECT 1 FROM admin_users WHERE id = user_record.id) INTO admin_exists;
    
    IF admin_exists THEN
        RAISE NOTICE '✅ Usuário já existe em admin_users. Nenhuma ação necessária.';
        RETURN;
    END IF;
    
    RAISE NOTICE '⚠️ Usuário NÃO encontrado em admin_users. Inserindo...';
    
    -- Buscar loja associada
    SELECT id, name INTO store_record
    FROM stores
    WHERE owner_email = :'email'
    LIMIT 1;
    
    IF store_record.id IS NULL THEN
        RAISE WARNING '⚠️ Nenhuma loja encontrada para este email. Será necessário criar uma loja primeiro.';
        RAISE EXCEPTION '❌ Não é possível inserir usuário sem loja. Crie uma loja primeiro ou associe uma loja existente.';
    END IF;
    
    RAISE NOTICE '✅ Loja encontrada:';
    RAISE NOTICE '   Store ID: %', store_record.id;
    RAISE NOTICE '   Store Name: %', store_record.name;
    
    -- Inserir usuário em admin_users
    INSERT INTO admin_users (id, email, store_id, role)
    VALUES (
        user_record.id,
        user_record.email,
        store_record.id,
        'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        store_id = EXCLUDED.store_id,
        role = EXCLUDED.role;
    
    RAISE NOTICE '✅ Usuário inserido/atualizado em admin_users com sucesso!';
    
    -- Verificar inserção
    SELECT id, email, store_id, role INTO user_record
    FROM admin_users
    WHERE id = user_record.id;
    
    RAISE NOTICE '✅ Verificação:';
    RAISE NOTICE '   ID: %', user_record.id;
    RAISE NOTICE '   Email: %', user_record.email;
    RAISE NOTICE '   Store ID: %', user_record.store_id;
    RAISE NOTICE '   Role: %', user_record.role;
    
END $$;

-- 2. Verificar resultado final
SELECT 
    'admin_users' as tabela,
    id,
    email,
    store_id,
    role,
    created_at
FROM admin_users
WHERE email = :'email';



