-- ============================================
-- DELETAR FÉQUEIJÃO - COMANDOS SIMPLES
-- ============================================
-- Execute cada comando UM POR VEZ no Supabase SQL Editor
-- Não execute tudo de uma vez!
-- ============================================

-- PASSO 1: Ver todas as lojas (para identificar o ID)
SELECT id, name, slug FROM stores;

-- PASSO 2: Se você viu a loja FÉQUEIJÃO acima, copie o ID dela
-- Depois substitua 'ID_AQUI' pelo ID real nos comandos abaixo

-- PASSO 3: Execute estes comandos UM POR VEZ (substitua ID_AQUI pelo ID real):

-- Comando 1: Deletar produtos
DELETE FROM products 
WHERE store_id = 'ID_AQUI'::uuid;

-- Comando 2: Deletar subsets
DELETE FROM subsets 
WHERE store_id = 'ID_AQUI'::uuid;

-- Comando 3: Deletar sets
DELETE FROM sets 
WHERE store_id = 'ID_AQUI'::uuid;

-- Comando 4: Deletar customizações
DELETE FROM store_customizations 
WHERE store_id = 'ID_AQUI'::uuid;

-- Comando 5: Deletar admin_users
DELETE FROM admin_users 
WHERE store_id = 'ID_AQUI'::uuid;

-- Comando 6: Deletar a loja
DELETE FROM stores 
WHERE id = 'ID_AQUI'::uuid;

-- ============================================
-- ALTERNATIVA: Se não souber o ID, use estes comandos:
-- ============================================

-- Execute UM POR VEZ:

DELETE FROM products 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);

DELETE FROM subsets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);

DELETE FROM sets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);

DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);

DELETE FROM admin_users 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);

DELETE FROM stores 
WHERE LOWER(name) LIKE '%fequeij%' 
   OR LOWER(slug) LIKE '%fequeij%';

-- Verificar se foi deletada
SELECT id, name, slug FROM stores;

