-- ============================================
-- CORREÇÃO RLS PARA PERMITIR CADASTRO
-- ============================================
-- Execute este SQL no Supabase SQL Editor para
-- corrigir as políticas de segurança e permitir
-- o cadastro de novos usuários/lojas
-- ============================================

-- 1. Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can create store customizations" ON store_customizations;

-- 2. Recriar política para criação de stores (SEM RESTRIÇÕES)
CREATE POLICY "Allow authenticated to create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Recriar política para criação de admin_users
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 4. Recriar política para criação de store_customizations
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users WHERE id = auth.uid()
  )
);

-- 5. Verificar se as políticas foram criadas
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
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, policyname;

-- ============================================
-- INSTRUÇÕES
-- ============================================
-- 1. Copie todo este código
-- 2. Vá para o Supabase Dashboard > SQL Editor
-- 3. Cole o código e execute
-- 4. Verifique se não há erros
-- 5. Teste o cadastro novamente
-- ============================================

