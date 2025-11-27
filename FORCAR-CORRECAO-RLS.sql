-- ============================================
-- FORÇAR CORREÇÃO DE RLS - SCRIPT AGRESSIVO
-- ============================================
-- Este script FORÇA a correção removendo TUDO e recriando
-- Execute no Supabase SQL Editor
-- ============================================

-- PASSO 1: DESABILITAR RLS COMPLETAMENTE
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsets DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLÍTICAS (FORÇADO)
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['stores', 'admin_users', 'store_customizations', 'products', 'sets', 'subsets'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, table_name);
            RAISE NOTICE 'Política removida: %.%', table_name, r.policyname;
        END LOOP;
    END LOOP;
END $$;

-- PASSO 3: REABILITAR RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsets ENABLE ROW LEVEL SECURITY;

-- PASSO 4: CRIAR POLÍTICAS ESSENCIAIS (MÁXIMA PERMISSIVIDADE)

-- ============================================
-- STORES - POLÍTICAS CRÍTICAS
-- ============================================

-- INSERT: PERMITE QUALQUER USUÁRIO AUTENTICADO CRIAR LOJA
CREATE POLICY "Allow authenticated to create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

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
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- UPDATE: Admins podem atualizar sua própria loja
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
)
WITH CHECK (
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- ============================================
-- ADMIN_USERS - POLÍTICAS CRÍTICAS
-- ============================================

-- INSERT: PERMITE USUÁRIO CRIAR SEU PRÓPRIO REGISTRO ADMIN
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- SELECT: Admins podem ver seu próprio registro
CREATE POLICY "Admins can view their own admin user"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- UPDATE: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- STORE_CUSTOMIZATIONS - POLÍTICAS CRÍTICAS
-- ============================================

-- INSERT: PERMITE QUALQUER USUÁRIO AUTENTICADO CRIAR CUSTOMIZAÇÕES
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Público pode ver customizações
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- UPDATE: Admins podem atualizar customizações de sua loja
CREATE POLICY "Admins can update their store customizations"
ON store_customizations FOR UPDATE
TO authenticated
USING (
  store_id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
)
WITH CHECK (
  store_id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- DELETE: Admins podem deletar customizações de sua loja
CREATE POLICY "Admins can delete their store customizations"
ON store_customizations FOR DELETE
TO authenticated
USING (
  store_id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar políticas INSERT criadas
SELECT 
  'VERIFICAÇÃO' as tipo,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- Verificar RLS habilitado
SELECT 
  'RLS STATUS' as tipo,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Você deve ver:
-- ✅ 3 políticas INSERT (uma para cada tabela)
-- ✅ RLS habilitado (true) em todas as 3 tabelas
-- ============================================

