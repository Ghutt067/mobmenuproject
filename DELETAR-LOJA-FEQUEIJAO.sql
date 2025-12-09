-- ============================================
-- DELETAR COMPLETAMENTE A LOJA FÉQUEIJÃO
-- ============================================
-- Este script deleta TODOS os dados da loja FÉQUEIJÃO
-- incluindo produtos, customizações, sets, subsets, etc.
-- ============================================
-- ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- Execute apenas se tiver certeza!
-- ============================================

DO $$
DECLARE
    fequeijao_store_id UUID;
    fequeijao_admin_id UUID;
BEGIN
    -- Encontrar o ID da loja FÉQUEIJÃO pelo slug ou nome
    SELECT id INTO fequeijao_store_id
    FROM stores
    WHERE LOWER(slug) = 'féqueijão' 
       OR LOWER(slug) = 'fequeijao'
       OR LOWER(slug) = 'fequeijão'
       OR LOWER(name) LIKE '%FÉQUEIJÃO%'
       OR LOWER(name) LIKE '%Féqueijão%'
       OR LOWER(name) LIKE '%fequeijao%'
    LIMIT 1;
    
    IF fequeijao_store_id IS NULL THEN
        RAISE NOTICE '⚠️ Loja FÉQUEIJÃO não encontrada. Verificando todas as lojas...';
        -- Listar todas as lojas para ajudar a identificar
        FOR fequeijao_store_id IN SELECT id FROM stores LOOP
            DECLARE
                store_name TEXT;
                store_slug TEXT;
            BEGIN
                SELECT name, slug INTO store_name, store_slug FROM stores WHERE id = fequeijao_store_id;
                RAISE NOTICE 'Loja encontrada: % (slug: %)', store_name, store_slug;
            END;
        END LOOP;
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Loja FÉQUEIJÃO encontrada com ID: %', fequeijao_store_id;
    
    -- Encontrar o admin_user associado
    SELECT id INTO fequeijao_admin_id
    FROM admin_users
    WHERE store_id = fequeijao_store_id
    LIMIT 1;
    
    -- ============================================
    -- DELETAR DADOS RELACIONADOS (por segurança, mesmo com CASCADE)
    -- ============================================
    
    -- Deletar produtos
    DELETE FROM products WHERE store_id = fequeijao_store_id;
    RAISE NOTICE '✅ Produtos deletados';
    
    -- Deletar subsets
    DELETE FROM subsets WHERE store_id = fequeijao_store_id;
    RAISE NOTICE '✅ Subsets deletados';
    
    -- Deletar sets
    DELETE FROM sets WHERE store_id = fequeijao_store_id;
    RAISE NOTICE '✅ Sets deletados';
    
    -- Deletar customizações
    DELETE FROM store_customizations WHERE store_id = fequeijao_store_id;
    RAISE NOTICE '✅ Customizações deletadas';
    
    -- Deletar admin_users
    DELETE FROM admin_users WHERE store_id = fequeijao_store_id;
    RAISE NOTICE '✅ Admin users deletados';
    
    -- Deletar a loja (isso deve deletar tudo automaticamente devido ao CASCADE)
    DELETE FROM stores WHERE id = fequeijao_store_id;
    RAISE NOTICE '✅ Loja deletada';
    
    -- Se houver um admin_user específico, tentar deletar do auth.users também
    IF fequeijao_admin_id IS NOT NULL THEN
        BEGIN
            -- Nota: Isso pode falhar se não tiver permissões suficientes
            -- Se falhar, delete manualmente no Supabase Dashboard
            DELETE FROM auth.users WHERE id = fequeijao_admin_id;
            RAISE NOTICE '✅ Usuário deletado do auth.users';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Não foi possível deletar de auth.users automaticamente.';
            RAISE NOTICE '   Por favor, delete manualmente no Supabase Dashboard:';
            RAISE NOTICE '   Authentication > Users > Buscar pelo ID: %', fequeijao_admin_id;
        END;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 LOJA FÉQUEIJÃO DELETADA COMPLETAMENTE!';
    RAISE NOTICE '';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao deletar loja: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICAR SE FOI DELETADA
-- ============================================
SELECT 
    'Verificando se a loja FÉQUEIJÃO foi deletada...' as status;

-- Verificar se ainda existe
SELECT id, name, slug 
FROM stores 
WHERE LOWER(slug) LIKE '%fequeij%' 
   OR LOWER(name) LIKE '%fequeij%';

-- Se não retornar nenhuma linha, foi deletada com sucesso!
-- Se ainda aparecer algo, execute o script novamente ou delete manualmente

