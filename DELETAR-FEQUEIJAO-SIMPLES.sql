-- ============================================
-- DELETAR LOJA FÉQUEIJÃO - VERSÃO SIMPLES
-- ============================================
-- Execute este script passo a passo se o anterior travar
-- ============================================

-- PASSO 1: Ver quais lojas existem
SELECT id, name, slug FROM stores;

-- PASSO 2: Encontrar o ID da loja FÉQUEIJÃO (copie o ID que aparecer)
-- Se não aparecer nenhuma loja com nome/slug relacionado a fequeijão, ela já foi deletada
SELECT id, name, slug 
FROM stores 
WHERE LOWER(slug) LIKE '%fequeij%' 
   OR LOWER(name) LIKE '%fequeij%'
   OR LOWER(slug) LIKE '%féqueij%'
   OR LOWER(name) LIKE '%féqueij%';

-- PASSO 3: Se encontrou a loja, copie o ID e substitua no script abaixo
-- Exemplo: Se o ID for '123e4567-e89b-12d3-a456-426614174000'
-- Substitua 'SEU_ID_AQUI' pelo ID real

/*
-- PASSO 4: Descomente e execute (substitua SEU_ID_AQUI pelo ID real):
DO $$
BEGIN
    DECLARE store_id_var UUID := 'SEU_ID_AQUI'; -- SUBSTITUA AQUI
    
    -- Deletar tudo relacionado
    DELETE FROM products WHERE store_id = store_id_var;
    DELETE FROM subsets WHERE store_id = store_id_var;
    DELETE FROM sets WHERE store_id = store_id_var;
    DELETE FROM store_customizations WHERE store_id = store_id_var;
    DELETE FROM admin_users WHERE store_id = store_id_var;
    DELETE FROM stores WHERE id = store_id_var;
    
    RAISE NOTICE 'Loja deletada com sucesso!';
END $$;
*/

-- ============================================
-- ALTERNATIVA: Deletar diretamente por nome/slug
-- ============================================

-- Execute este bloco para deletar diretamente:
DELETE FROM products 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(slug) LIKE '%fequeij%' 
       OR LOWER(name) LIKE '%fequeij%'
);

DELETE FROM subsets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(slug) LIKE '%fequeij%' 
       OR LOWER(name) LIKE '%fequeij%'
);

DELETE FROM sets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(slug) LIKE '%fequeij%' 
       OR LOWER(name) LIKE '%fequeij%'
);

DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(slug) LIKE '%fequeij%' 
       OR LOWER(name) LIKE '%fequeij%'
);

DELETE FROM admin_users 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(slug) LIKE '%fequeij%' 
       OR LOWER(name) LIKE '%fequeij%'
);

DELETE FROM stores 
WHERE LOWER(slug) LIKE '%fequeij%' 
   OR LOWER(name) LIKE '%fequeij%'
   OR LOWER(slug) LIKE '%féqueij%'
   OR LOWER(name) LIKE '%féqueij%';

-- Verificar se foi deletada
SELECT 'Verificando se foi deletada...' as status;
SELECT id, name, slug FROM stores WHERE LOWER(slug) LIKE '%fequeij%' OR LOWER(name) LIKE '%fequeij%';

