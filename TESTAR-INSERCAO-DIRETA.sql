-- ============================================
-- TESTE: Verificar se as políticas funcionam
-- ============================================
-- Este script testa se as políticas estão funcionando
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar se as políticas INSERT existem e estão corretas
SELECT 
    'POLÍTICAS INSERT' as tipo,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
AND cmd = 'INSERT';

-- 2. Verificar se RLS está habilitado
SELECT 
    'RLS STATUS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'stores';

-- 3. Verificar se há outras políticas que podem estar bloqueando
SELECT 
    'TODAS AS POLÍTICAS DE STORES' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
ORDER BY cmd, policyname;

-- ============================================
-- OBSERVAÇÕES:
-- ============================================
-- Se a política INSERT existe mas ainda dá erro 42501,
-- pode ser que:
-- 1. O usuário não está sendo reconhecido como "authenticated"
-- 2. Há outra política bloqueando
-- 3. O token não está sendo enviado corretamente
-- ============================================

