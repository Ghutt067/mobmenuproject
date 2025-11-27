-- ============================================
-- VERIFICAR CONEXÃO E PRODUTOS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para verificar se há produtos e se as políticas estão corretas
-- ============================================

-- 1. Verificar se há produtos no banco
SELECT 
    'PRODUTOS NO BANCO' as tipo,
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as produtos_ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as produtos_inativos
FROM products;

-- 2. Verificar produtos por loja
SELECT 
    'PRODUTOS POR LOJA' as tipo,
    s.name as loja,
    s.id as store_id,
    COUNT(p.id) as total_produtos,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as produtos_ativos
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 3. Verificar políticas RLS de produtos
SELECT 
    'POLÍTICAS RLS - PRODUCTS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'products'
ORDER BY cmd, policyname;

-- 4. Verificar se RLS está habilitado em products
SELECT 
    'RLS STATUS - PRODUCTS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- 5. Verificar políticas RLS de sets
SELECT 
    'POLÍTICAS RLS - SETS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'sets'
ORDER BY cmd, policyname;

-- 6. Verificar políticas RLS de subsets
SELECT 
    'POLÍTICAS RLS - SUBSETS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'subsets'
ORDER BY cmd, policyname;

-- 7. Listar alguns produtos de exemplo (primeiros 5)
SELECT 
    'EXEMPLO DE PRODUTOS' as tipo,
    p.id,
    p.title,
    p.is_active,
    p.store_id,
    s.name as loja
FROM products p
LEFT JOIN stores s ON s.id = p.store_id
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. Verificar se há sets e subsets
SELECT 
    'SETS E SUBSETS' as tipo,
    (SELECT COUNT(*) FROM sets WHERE is_active = true) as sets_ativos,
    (SELECT COUNT(*) FROM subsets WHERE is_active = true) as subsets_ativos;




