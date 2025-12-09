-- ============================================
-- COMANDOS SUPER SIMPLES - EXECUTE UM POR VEZ
-- ============================================

-- COMANDO 1: Ver todas as lojas
SELECT id, name, slug FROM stores;

-- COMANDO 2: Deletar produtos da FÉQUEIJÃO
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');

-- COMANDO 3: Deletar subsets da FÉQUEIJÃO
DELETE FROM subsets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');

-- COMANDO 4: Deletar sets da FÉQUEIJÃO
DELETE FROM sets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');

-- COMANDO 5: Deletar customizações da FÉQUEIJÃO
DELETE FROM store_customizations WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');

-- COMANDO 6: Deletar admin_users da FÉQUEIJÃO
DELETE FROM admin_users WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');

-- COMANDO 7: Deletar a loja FÉQUEIJÃO
DELETE FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';

-- COMANDO 8: Verificar se foi deletada (não deve retornar nada)
SELECT id, name, slug FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';

