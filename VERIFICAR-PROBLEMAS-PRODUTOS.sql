-- ============================================
-- VERIFICAR PROBLEMAS COM PRODUTOS
-- ============================================
-- Execute este script para verificar se há
-- problemas com a tabela products e políticas RLS
-- ============================================

-- 1. Verificar se a tabela products existe
SELECT 
    'Verificação de Tabela' as teste,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public')
        THEN '✅ Tabela products existe'
        ELSE '❌ Tabela products NÃO existe - Execute CRIAR-TODAS-TABELAS-PRODUTOS.sql'
    END as resultado;

-- 2. Verificar colunas da tabela products
SELECT 
    'Colunas da Tabela' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT 
    'Status RLS' as teste,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- 4. Verificar políticas RLS
SELECT 
    'Políticas RLS' as teste,
    policyname,
    cmd as operacao,
    roles,
    qual as condicao_using,
    with_check as condicao_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY cmd, policyname;

-- 5. Verificar se há política para INSERT
SELECT 
    'Política INSERT' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'products' 
            AND cmd = 'INSERT'
            AND schemaname = 'public'
        ) THEN '✅ Política INSERT existe'
        ELSE '❌ Política INSERT NÃO existe - Execute CRIAR-TODAS-TABELAS-PRODUTOS.sql'
    END as resultado;

-- 6. Testar inserção (simulação - não insere de verdade)
-- Substitua '28b43f18-a5b5-4872-95d7-6c694c2f9a84' pelo ID da sua loja se necessário
SELECT 
    'Teste de Permissão' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admin_users 
            WHERE store_id = '28b43f18-a5b5-4872-95d7-6c694c2f9a84'::uuid
        ) THEN '✅ Loja encontrada em admin_users'
        ELSE '❌ Loja NÃO encontrada em admin_users'
    END as resultado;

-- 7. Verificar se o usuário atual tem acesso à loja
-- NOTA: Isso só funciona no contexto de uma sessão autenticada
DO $$
DECLARE
    current_user_id uuid;
    user_store_id uuid;
BEGIN
    -- Tentar obter o ID do usuário atual
    BEGIN
        current_user_id := auth.uid();
        
        IF current_user_id IS NULL THEN
            RAISE NOTICE '⚠️ Nenhum usuário autenticado no momento';
            RETURN;
        END IF;
        
        RAISE NOTICE '✅ Usuário autenticado: %', current_user_id;
        
        -- Verificar se o usuário tem loja associada
        SELECT store_id INTO user_store_id
        FROM admin_users
        WHERE id = current_user_id;
        
        IF user_store_id IS NULL THEN
            RAISE NOTICE '❌ Usuário não tem loja associada em admin_users';
        ELSE
            RAISE NOTICE '✅ Usuário tem loja associada: %', user_store_id;
            
            -- Verificar se a loja existe
            IF EXISTS (SELECT 1 FROM stores WHERE id = user_store_id) THEN
                RAISE NOTICE '✅ Loja existe em stores';
            ELSE
                RAISE NOTICE '❌ Loja NÃO existe em stores';
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro ao verificar usuário: %', SQLERRM;
    END;
END $$;

-- 8. Verificar índices
SELECT 
    'Índices' as teste,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'products';

-- 9. Verificar triggers
SELECT 
    'Triggers' as teste,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products'
AND event_object_schema = 'public';

-- 10. Contar produtos existentes
SELECT 
    'Produtos Existentes' as teste,
    COUNT(*) as total_produtos,
    COUNT(DISTINCT store_id) as lojas_com_produtos
FROM products;

