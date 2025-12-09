-- ============================================
-- VERIFICAR E LIMPAR TUDO RELACIONADO AO FEQUEIJÃO
-- ============================================
-- Execute estes comandos UM POR VEZ no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Ver todas as lojas cadastradas
SELECT id, name, slug, created_at 
FROM stores 
ORDER BY created_at DESC;

-- PASSO 2: Ver todas as customizações (com nome da loja)
SELECT 
    sc.id as customization_id,
    sc.store_id,
    s.name as store_name,
    s.slug as store_slug,
    sc.primary_color,
    sc.secondary_color,
    sc.background_color,
    sc.text_color,
    sc.created_at
FROM store_customizations sc
JOIN stores s ON s.id = sc.store_id
ORDER BY sc.created_at DESC;

-- PASSO 3: Buscar qualquer referência ao fequeijão (case-insensitive)
SELECT 
    id, 
    name, 
    slug,
    LOWER(name) as name_lower,
    LOWER(slug) as slug_lower
FROM stores 
WHERE LOWER(name) LIKE '%fequeij%' 
   OR LOWER(slug) LIKE '%fequeij%'
   OR LOWER(name) LIKE '%féqueij%'
   OR LOWER(slug) LIKE '%féqueij%';

-- PASSO 4: Deletar customizações de lojas que contenham "fequeij" no nome ou slug
DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
       OR LOWER(name) LIKE '%féqueij%'
       OR LOWER(slug) LIKE '%féqueij%'
);

-- PASSO 5: Verificar novamente se restou algo
SELECT 
    sc.id as customization_id,
    sc.store_id,
    s.name as store_name,
    s.slug as store_slug
FROM store_customizations sc
JOIN stores s ON s.id = sc.store_id
WHERE LOWER(s.name) LIKE '%fequeij%' 
   OR LOWER(s.slug) LIKE '%fequeij%';

-- Se retornar VAZIO, está tudo limpo!

