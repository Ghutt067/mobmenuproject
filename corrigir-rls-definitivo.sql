-- ============================================
-- CORREÇÃO DEFINITIVA DAS POLÍTICAS RLS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script FORÇA a remoção e recriação de todas as políticas
-- ============================================

-- ============================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA LIMPAR
-- ============================================

ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- REMOVER TODAS AS POLÍTICAS (FORÇADO)
-- ============================================

-- Remover TODAS as políticas da tabela stores
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores';
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela admin_users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users';
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela store_customizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'store_customizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations';
    END LOOP;
END $$;

-- ============================================
-- HABILITAR RLS E CRIAR POLÍTICAS CORRETAS
-- ============================================

-- ============================================
-- TABELA: stores
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver lojas ativas
CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

-- SELECT: Admins podem ver sua própria loja
CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- INSERT: Qualquer usuário autenticado pode criar loja (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admins podem atualizar sua própria loja
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- TABELA: admin_users
-- ============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins podem ver seu próprio registro
CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- INSERT: Usuários autenticados podem criar seu próprio registro admin (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- ============================================
-- TABELA: store_customizations
-- ============================================

ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver customizações
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Usuários autenticados podem criar customizações (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create store customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE/DELETE: Admins podem gerenciar customizações de sua loja
CREATE POLICY "Admins can manage their store customizations"
ON store_customizations FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar:
-- 1. Verifique se a confirmação de email está DESABILITADA no Supabase Auth
-- 2. Teste o cadastro novamente
-- ============================================

