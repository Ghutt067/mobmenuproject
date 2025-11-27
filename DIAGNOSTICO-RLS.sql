-- ============================================
-- 🔍 DIAGNÓSTICO RLS - EXECUTE PRIMEIRO
-- ============================================
-- Execute esta query para verificar o estado atual
-- ============================================

-- 1. Verificar se RLS está habilitado
SELECT 
    'RLS STATUS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename;

-- 2. Verificar TODAS as políticas existentes
SELECT 
    'TODAS AS POLÍTICAS' as tipo,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd, policyname;

-- 3. Verificar políticas INSERT especificamente
SELECT 
    'POLÍTICAS INSERT' as tipo,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
AND cmd = 'INSERT'
ORDER BY tablename;

-- 4. Verificar se as tabelas existem
SELECT 
    'TABELAS EXISTENTES' as tipo,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename;

