-- ============================================
-- POLÍTICAS RLS PARA PERMITIR CADASTRO
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- para permitir que usuários autenticados
-- criem lojas durante o cadastro
-- ============================================

-- 1. Política para permitir INSERT na tabela stores
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Política para permitir UPDATE na tabela stores (admins podem atualizar sua loja)
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 3. Habilitar RLS na tabela admin_users (se ainda não estiver habilitado)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Política para permitir SELECT na tabela admin_users
CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 5. Política para permitir INSERT na tabela admin_users (durante o cadastro)
CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 6. Política para permitir UPDATE na tabela admin_users
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 7. Política para permitir INSERT na tabela store_customizations (durante o cadastro)
CREATE POLICY "Authenticated users can create store customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

