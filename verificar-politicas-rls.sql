-- ============================================
-- VERIFICAR SE AS POLÍTICAS RLS ESTÃO CRIADAS
-- ============================================
-- Execute este SQL para verificar quais políticas existem
-- ============================================

-- Ver políticas da tabela stores
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stores'
ORDER BY policyname;

-- Ver políticas da tabela admin_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_users'
ORDER BY policyname;

-- Ver políticas da tabela store_customizations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'store_customizations'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations');

