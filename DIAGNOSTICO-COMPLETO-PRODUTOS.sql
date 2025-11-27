-- ============================================
-- DIAGNÓSTICO COMPLETO - PROBLEMA COM PRODUTOS
-- ============================================
-- Execute este script para verificar TODOS os
-- aspectos relacionados à criação de produtos
-- ============================================

-- 1. Verificar se a tabela products existe
SELECT 
    '1. Tabela Products' as verificacao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status;

-- 2. Verificar se RLS está habilitado
SELECT 
    '2. RLS Habilitado' as verificacao,
    CASE 
        WHEN rowsecurity THEN '✅ SIM'
        ELSE '❌ NÃO'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- 3. Listar TODAS as políticas RLS
SELECT 
    '3. Políticas RLS' as verificacao,
    policyname as nome,
    cmd as operacao,
    CASE 
        WHEN cmd = 'INSERT' THEN 
            CASE 
                WHEN with_check IS NOT NULL THEN '✅ COM WITH CHECK'
                ELSE '⚠️ SEM WITH CHECK'
            END
        ELSE 'N/A'
    END as status_insert
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY cmd, policyname;

-- 4. Verificar especificamente a política de INSERT
SELECT 
    '4. Política INSERT' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'products' 
            AND cmd = 'INSERT'
            AND schemaname = 'public'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - PROBLEMA CRÍTICO!'
    END as status,
    COUNT(*) as total_politicas_insert
FROM pg_policies
WHERE tablename = 'products' 
AND cmd = 'INSERT'
AND schemaname = 'public';

-- 5. Ver detalhes da política de INSERT (se existir)
SELECT 
    '5. Detalhes Política INSERT' as verificacao,
    policyname,
    with_check as condicao_with_check,
    CASE 
        WHEN with_check LIKE '%auth.uid()%' THEN '✅ Usa auth.uid()'
        WHEN with_check LIKE '%admin_users%' THEN '✅ Verifica admin_users'
        ELSE '⚠️ Verificar condição'
    END as status
FROM pg_policies
WHERE tablename = 'products' 
AND cmd = 'INSERT'
AND schemaname = 'public';

-- 6. Verificar se o usuário atual tem loja associada
-- NOTA: Execute isso enquanto estiver logado na aplicação
DO $$
DECLARE
    current_user_id uuid;
    user_store_id uuid;
    store_exists boolean;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '6. Usuário Autenticado: ❌ NÃO (Execute enquanto estiver logado)';
        RETURN;
    END IF;
    
    RAISE NOTICE '6. Usuário Autenticado: ✅ SIM - ID: %', current_user_id;
    
    SELECT store_id INTO user_store_id
    FROM admin_users
    WHERE id = current_user_id;
    
    IF user_store_id IS NULL THEN
        RAISE NOTICE '6. Loja Associada: ❌ NÃO - Usuário não tem loja em admin_users';
    ELSE
        RAISE NOTICE '6. Loja Associada: ✅ SIM - Store ID: %', user_store_id;
        
        SELECT EXISTS(SELECT 1 FROM stores WHERE id = user_store_id) INTO store_exists;
        
        IF store_exists THEN
            RAISE NOTICE '6. Loja Existe: ✅ SIM';
        ELSE
            RAISE NOTICE '6. Loja Existe: ❌ NÃO - Loja não encontrada em stores';
        END IF;
    END IF;
END $$;

-- 7. Verificar estrutura da tabela (colunas obrigatórias)
SELECT 
    '7. Colunas Obrigatórias' as verificacao,
    column_name,
    CASE 
        WHEN is_nullable = 'NO' AND column_default IS NULL THEN '⚠️ OBRIGATÓRIA SEM DEFAULT'
        WHEN is_nullable = 'NO' THEN '✅ OBRIGATÓRIA COM DEFAULT'
        ELSE '✅ OPCIONAL'
    END as status
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
AND column_name IN ('store_id', 'title', 'new_price')
ORDER BY column_name;

-- 8. Testar se podemos fazer SELECT (verificar permissão de leitura)
SELECT 
    '8. Permissão SELECT' as verificacao,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ FUNCIONA'
        ELSE '❌ NÃO FUNCIONA'
    END as status,
    COUNT(*) as total_produtos
FROM products;

-- 9. Verificar se há triggers configurados
SELECT 
    '9. Triggers' as verificacao,
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name LIKE '%has_discount%' THEN '✅ Trigger has_discount'
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ Trigger updated_at'
        ELSE '⚠️ Outro trigger'
    END as status
FROM information_schema.triggers
WHERE event_object_table = 'products'
AND event_object_schema = 'public';

-- 10. Resumo final
SELECT 
    '10. RESUMO' as verificacao,
    'Tabela existe' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN '✅'
        ELSE '❌'
    END as status
UNION ALL
SELECT 
    '10. RESUMO',
    'RLS habilitado',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'products' AND rowsecurity = true
        ) THEN '✅'
        ELSE '❌'
    END
UNION ALL
SELECT 
    '10. RESUMO',
    'Política INSERT existe',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'products' AND cmd = 'INSERT'
        ) THEN '✅'
        ELSE '❌ CRÍTICO!'
    END
UNION ALL
SELECT 
    '10. RESUMO',
    'Total de produtos',
    CAST(COUNT(*) AS TEXT)
FROM products;


