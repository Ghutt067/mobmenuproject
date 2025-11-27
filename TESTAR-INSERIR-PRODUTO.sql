-- ============================================
-- TESTAR INSERÇÃO DE PRODUTO DIRETAMENTE
-- ============================================
-- Execute este script ENQUANTO ESTIVER LOGADO
-- na aplicação para testar se a inserção funciona
-- ============================================
-- IMPORTANTE: Substitua o store_id pelo ID da sua loja
-- ============================================

-- 1. Verificar usuário atual e loja
DO $$
DECLARE
    current_user_id uuid;
    user_store_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Nenhum usuário autenticado. Faça login na aplicação primeiro!';
    END IF;
    
    RAISE NOTICE '✅ Usuário autenticado: %', current_user_id;
    
    SELECT store_id INTO user_store_id
    FROM admin_users
    WHERE id = current_user_id;
    
    IF user_store_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não tem loja associada em admin_users';
    END IF;
    
    RAISE NOTICE '✅ Store ID do usuário: %', user_store_id;
    
    -- Tentar inserir um produto de teste
    BEGIN
        INSERT INTO products (
            store_id,
            title,
            description1,
            description2,
            old_price,
            new_price,
            is_active,
            display_order
        ) VALUES (
            user_store_id,
            'Produto de Teste',
            'Descrição 1 de teste',
            'Descrição 2 de teste',
            'R$ 50,00',
            'R$ 40,00',
            true,
            0
        ) RETURNING id, title, store_id;
        
        RAISE NOTICE '✅ PRODUTO INSERIDO COM SUCESSO!';
        RAISE NOTICE '✅ Se você viu esta mensagem, a política RLS está funcionando!';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ ERRO ao inserir produto: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- 2. Verificar se o produto foi criado
SELECT 
    'Produto Criado' as status,
    id,
    title,
    store_id,
    new_price,
    created_at
FROM products
WHERE title = 'Produto de Teste'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Limpar produto de teste (opcional - descomente para limpar)
-- DELETE FROM products WHERE title = 'Produto de Teste';


