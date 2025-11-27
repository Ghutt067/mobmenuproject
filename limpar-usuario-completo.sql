-- ============================================
-- LIMPAR USUÁRIO COMPLETAMENTE DO SUPABASE
-- ============================================
-- Use este script para remover TODOS os dados
-- de um usuário específico (incluindo auth.users)
-- ============================================
-- IMPORTANTE: Substitua 'EMAIL_DO_USUARIO@exemplo.com'
-- pelo email que você quer limpar
-- ============================================

-- 1. Encontrar o ID do usuário pelo email
DO $$
DECLARE
    user_id_to_delete UUID;
    store_id_to_delete UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = 'EMAIL_DO_USUARIO@exemplo.com';
    
    -- Se não encontrar, tentar buscar pelo email em admin_users
    IF user_id_to_delete IS NULL THEN
        SELECT id INTO user_id_to_delete
        FROM admin_users
        WHERE email = 'EMAIL_DO_USUARIO@exemplo.com';
    END IF;
    
    -- Se ainda não encontrar, mostrar mensagem
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado com este email.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Encontrado usuário com ID: %', user_id_to_delete;
    
    -- 2. Buscar o store_id associado
    SELECT store_id INTO store_id_to_delete
    FROM admin_users
    WHERE id = user_id_to_delete;
    
    -- 3. Deletar dados relacionados (em ordem de dependência)
    
    -- Deletar customizações da loja
    IF store_id_to_delete IS NOT NULL THEN
        DELETE FROM store_customizations 
        WHERE store_id = store_id_to_delete;
        RAISE NOTICE 'Customizações deletadas.';
        
        -- Deletar produtos da loja
        DELETE FROM products 
        WHERE store_id = store_id_to_delete;
        RAISE NOTICE 'Produtos deletados.';
        
        -- Deletar sets da loja
        DELETE FROM sets 
        WHERE store_id = store_id_to_delete;
        RAISE NOTICE 'Sets deletados.';
        
        -- Deletar subsets da loja
        DELETE FROM subsets 
        WHERE store_id = store_id_to_delete;
        RAISE NOTICE 'Subsets deletados.';
        
        -- Deletar a loja
        DELETE FROM stores 
        WHERE id = store_id_to_delete;
        RAISE NOTICE 'Loja deletada.';
    END IF;
    
    -- Deletar admin_user
    DELETE FROM admin_users 
    WHERE id = user_id_to_delete;
    RAISE NOTICE 'Admin user deletado.';
    
    -- Deletar do auth.users (requer permissões especiais)
    -- NOTA: Isso pode não funcionar dependendo das permissões
    -- Se der erro, use o Supabase Dashboard para deletar manualmente
    BEGIN
        DELETE FROM auth.users 
        WHERE id = user_id_to_delete;
        RAISE NOTICE 'Usuário deletado do auth.users.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível deletar de auth.users automaticamente.';
        RAISE NOTICE 'Por favor, delete manualmente no Supabase Dashboard:';
        RAISE NOTICE 'Authentication > Users > Buscar pelo email > Deletar';
    END;
    
    RAISE NOTICE 'Limpeza concluída!';
END $$;

-- ============================================
-- VERIFICAR SE O USUÁRIO FOI DELETADO
-- ============================================

-- Verificar em auth.users
SELECT id, email, created_at, deleted_at
FROM auth.users
WHERE email = 'EMAIL_DO_USUARIO@exemplo.com';

-- Verificar em admin_users
SELECT id, email, store_id
FROM admin_users
WHERE email = 'EMAIL_DO_USUARIO@exemplo.com';

-- ============================================
-- LIMPAR TODOS OS USUÁRIOS DE TESTE
-- ============================================
-- Use com CUIDADO! Isso deleta TODOS os usuários
-- que não são da loja demo
-- ============================================

/*
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email, au.store_id
        FROM admin_users au
        WHERE au.store_id != '00000000-0000-0000-0000-000000000001'
    LOOP
        -- Deletar customizações
        DELETE FROM store_customizations WHERE store_id = user_record.store_id;
        
        -- Deletar produtos, sets, subsets
        DELETE FROM products WHERE store_id = user_record.store_id;
        DELETE FROM sets WHERE store_id = user_record.store_id;
        DELETE FROM subsets WHERE store_id = user_record.store_id;
        
        -- Deletar loja
        DELETE FROM stores WHERE id = user_record.store_id;
        
        -- Deletar admin_user
        DELETE FROM admin_users WHERE id = user_record.id;
        
        RAISE NOTICE 'Usuário % deletado', user_record.email;
    END LOOP;
END $$;
*/

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Substitua 'EMAIL_DO_USUARIO@exemplo.com' pelo email real
-- 2. Execute no Supabase SQL Editor
-- 3. Se der erro ao deletar de auth.users, delete manualmente:
--    - Supabase Dashboard > Authentication > Users
--    - Busque pelo email
--    - Clique em "Delete user"
-- 4. Teste o cadastro novamente
-- ============================================

