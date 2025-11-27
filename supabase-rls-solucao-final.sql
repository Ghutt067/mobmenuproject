-- ============================================
-- SOLUÇÃO COMPLETA PARA POLÍTICAS RLS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script remove TODAS as políticas existentes
-- e cria novas políticas que permitem cadastro
-- ============================================

-- ============================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Remover políticas da tabela stores
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Admins can view their own store" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Admins can update their own store" ON stores;

-- Remover políticas da tabela admin_users
DROP POLICY IF EXISTS "Admins can view their own admin user record" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can create their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Admins can update their own admin user" ON admin_users;

-- Remover políticas da tabela store_customizations
DROP POLICY IF EXISTS "Public can view store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Admins can manage their store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Authenticated users can create store customizations" ON store_customizations;

-- ============================================
-- CRIAR POLÍTICAS CORRETAS
-- ============================================

-- ============================================
-- TABELA: stores
-- ============================================

-- Habilitar RLS (se ainda não estiver habilitado)
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

-- Habilitar RLS (se ainda não estiver habilitado)
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

-- Habilitar RLS (se ainda não estiver habilitado)
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

