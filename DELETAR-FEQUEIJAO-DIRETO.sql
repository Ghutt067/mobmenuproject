-- ============================================
-- DELETAR LOJA FÉQUEIJÃO - VERSÃO DIRETA E SIMPLES
-- ============================================
-- Execute ESTE script - é mais simples e direto
-- ============================================

-- PRIMEIRO: Ver quais lojas existem
SELECT id, name, slug FROM stores ORDER BY created_at;

-- SEGUNDO: Deletar diretamente por nome/slug (execute tudo de uma vez)
-- Este script deleta TUDO relacionado à loja FÉQUEIJÃO

-- 1. Deletar produtos
DELETE FROM products 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
       OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
       OR LOWER(COALESCE(name, '')) LIKE '%féqueij%'
);

-- 2. Deletar subsets
DELETE FROM subsets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
       OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
       OR LOWER(COALESCE(name, '')) LIKE '%féqueij%'
);

-- 3. Deletar sets
DELETE FROM sets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
       OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
       OR LOWER(COALESCE(name, '')) LIKE '%féqueij%'
);

-- 4. Deletar customizações
DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
       OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
       OR LOWER(COALESCE(name, '')) LIKE '%féqueij%'
);

-- 5. Deletar admin_users
DELETE FROM admin_users 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
       OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
       OR LOWER(COALESCE(name, '')) LIKE '%féqueij%'
);

-- 6. Deletar a loja (último passo)
DELETE FROM stores 
WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
   OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
   OR LOWER(COALESCE(slug, '')) LIKE '%féqueij%'
   OR LOWER(COALESCE(name, '')) LIKE '%féqueij%';

-- VERIFICAR SE FOI DELETADA
SELECT 'Verificando se foi deletada...' as status;
SELECT id, name, slug 
FROM stores 
WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
   OR LOWER(COALESCE(name, '')) LIKE '%fequeij%';

-- Se não retornar nenhuma linha acima, a loja foi deletada com sucesso!

