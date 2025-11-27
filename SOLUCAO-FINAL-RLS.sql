-- ============================================
-- SOLUÇÃO FINAL DEFINITIVA - EXECUTE ESTE!
-- ============================================
-- Este script GARANTE que as políticas RLS funcionam
-- Execute no Supabase SQL Editor
-- ============================================

-- PASSO 1: FORÇAR REMOÇÃO DE TUDO
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores CASCADE';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users CASCADE';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'store_customizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations CASCADE';
    END LOOP;
END $$;

-- PASSO 2: REABILITAR RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- PASSO 3: CRIAR POLÍTICAS COM MÁXIMA PERMISSIVIDADE

-- STORES - INSERT (CRÍTICO!)
CREATE POLICY "stores_insert_authenticated"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- STORES - SELECT
CREATE POLICY "stores_select_public"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

CREATE POLICY "stores_select_own"
ON stores FOR SELECT
TO authenticated
USING (id IN (SELECT store_id FROM admin_users WHERE id = auth.uid()));

-- ADMIN_USERS - INSERT (CRÍTICO!)
CREATE POLICY "admin_users_insert_authenticated"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ADMIN_USERS - SELECT
CREATE POLICY "admin_users_select_own"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- STORE_CUSTOMIZATIONS - INSERT (CRÍTICO!)
CREATE POLICY "store_customizations_insert_authenticated"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- STORE_CUSTOMIZATIONS - SELECT
CREATE POLICY "store_customizations_select_public"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- VERIFICAÇÃO OBRIGATÓRIA
-- ============================================

-- Verificar políticas INSERT
SELECT 
  'POLÍTICAS INSERT' as tipo,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND cmd = 'INSERT';

-- Verificar RLS habilitado
SELECT 
  'RLS STATUS' as tipo,
  tablename,
  rowsecurity as habilitado
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND schemaname = 'public';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar 3 políticas INSERT:
-- 1. stores_insert_authenticated (stores)
-- 2. admin_users_insert_authenticated (admin_users)
-- 3. store_customizations_insert_authenticated (store_customizations)
-- 
-- E RLS habilitado (true) em todas as 3 tabelas
-- ============================================

