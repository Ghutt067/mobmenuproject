-- ============================================
-- LIMPAR CUSTOMIZAÇÕES DA LOJA FÉQUEIJAO
-- ============================================
-- Execute estes comandos para garantir que todas as customizações
-- relacionadas ao FÉQUEIJAO foram deletadas
-- ============================================

-- 1. Ver todas as customizações
SELECT sc.id, sc.store_id, s.name, s.slug 
FROM store_customizations sc
JOIN stores s ON s.id = sc.store_id;

-- 2. Deletar customizações relacionadas ao fequeijão (caso ainda existam)
DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
       OR LOWER(name) LIKE '%féqueij%'
       OR LOWER(slug) LIKE '%féqueij%'
);

-- 3. Verificar se restou alguma customização do fequeijão
SELECT sc.id, sc.store_id, s.name, s.slug 
FROM store_customizations sc
JOIN stores s ON s.id = sc.store_id
WHERE LOWER(s.name) LIKE '%fequeij%' 
   OR LOWER(s.slug) LIKE '%fequeij%';

-- Se não retornar nada, está tudo limpo!

