-- ============================================
-- RECRIAR POLÍTICAS STORES - SOLUÇÃO DEFINITIVA
-- ============================================
-- Este script recria as políticas de forma mais permissiva
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS DE STORES
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stores'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.stores CASCADE', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- 2. DESABILITAR E REABILITAR RLS
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICA INSERT MÁXIMA PERMISSIVIDADE
-- Esta política permite INSERT para QUALQUER usuário autenticado
CREATE POLICY stores_insert_authenticated
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. CRIAR POLÍTICA SELECT (para leitura)
CREATE POLICY stores_select_public
ON public.stores
FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

CREATE POLICY stores_select_own
ON public.stores
FOR SELECT
TO authenticated
USING (true); -- Permite ver todas as lojas se autenticado

-- 5. VERIFICAR
SELECT 
    'POLÍTICAS STORES' as tipo,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
ORDER BY cmd, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar:
-- stores_insert_authenticated | INSERT | {authenticated}
-- stores_select_own | SELECT | {authenticated}
-- stores_select_public | SELECT | {anon,authenticated}
-- ============================================

