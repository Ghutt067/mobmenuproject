-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA CADASTRO
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Remover políticas conflitantes da tabela stores (se existirem)
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Admins can update their own store" ON stores;

-- 2. Criar política para INSERT na tabela stores
-- Esta política permite que qualquer usuário autenticado crie uma loja
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Criar política para UPDATE na tabela stores
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 4. Habilitar RLS na tabela admin_users (se ainda não estiver habilitado)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas conflitantes da tabela admin_users (se existirem)
DROP POLICY IF EXISTS "Admins can view their own admin user record" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can create their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Admins can update their own admin user" ON admin_users;

-- 6. Criar políticas para admin_users
CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 7. Remover política conflitante da tabela store_customizations (se existir)
DROP POLICY IF EXISTS "Authenticated users can create store customizations" ON store_customizations;

-- 8. Criar política para INSERT na tabela store_customizations
CREATE POLICY "Authenticated users can create store customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

