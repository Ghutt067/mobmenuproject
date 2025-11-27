-- ============================================
-- SOLUÇÃO DEFINITIVA PARA RLS - CADASTRO
-- ============================================
-- Este script resolve o erro:
-- "new row violates row-level security policy for table 'stores'"
-- ============================================
-- IMPORTANTE: Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- ============================================
-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 2: REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Remover TODAS as políticas de stores
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stores'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores';
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- Remover TODAS as políticas de admin_users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users';
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- Remover TODAS as políticas de store_customizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'store_customizations'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations';
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- PASSO 3: REABILITAR RLS
-- ============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 4: CRIAR POLÍTICAS CORRETAS
-- ============================================

-- ============================================
-- TABELA: stores
-- ============================================

-- SELECT: Público pode ver lojas ativas
CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

-- SELECT: Admins podem ver sua própria loja (mesmo inativa)
CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- INSERT: QUALQUER usuário autenticado pode criar loja (SEM RESTRIÇÕES)
-- Esta é a política CRÍTICA para permitir cadastro
CREATE POLICY "Allow authenticated to create stores"
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
)
WITH CHECK (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- TABELA: admin_users
-- ============================================

-- SELECT: Admins podem ver seu próprio registro
CREATE POLICY "Admins can view their own admin user"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- INSERT: Usuários autenticados podem criar seu próprio registro admin
-- IMPORTANTE: Deve ser o mesmo ID do auth.uid()
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- TABELA: store_customizations
-- ============================================

-- SELECT: Público pode ver customizações
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Usuários autenticados podem criar customizações
-- IMPORTANTE: Permite criar mesmo sem ter admin_users ainda (durante cadastro)
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admins podem atualizar customizações de sua loja
CREATE POLICY "Admins can update their store customizations"
ON store_customizations FOR UPDATE
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

-- DELETE: Admins podem deletar customizações de sua loja
CREATE POLICY "Admins can delete their store customizations"
ON store_customizations FOR DELETE
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- PASSO 5: VERIFICAR POLÍTICAS CRIADAS
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- PASSO 6: VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND schemaname = 'public';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar:
-- 1. Verifique se todas as políticas foram criadas (PASSO 5)
-- 2. Verifique se RLS está habilitado (PASSO 6)
-- 3. Certifique-se de que a confirmação de email está DESABILITADA:
--    - Supabase Dashboard > Authentication > Settings
--    - Desabilite "Confirm email"
-- 4. Teste o cadastro novamente
-- ============================================

