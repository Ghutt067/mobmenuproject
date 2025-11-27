-- ============================================
-- CORREÇÃO RÁPIDA DE RLS - EXECUTE ESTE PRIMEIRO
-- ============================================
-- Este script corrige rapidamente as políticas RLS
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Remover de stores
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores';
    END LOOP;
    
    -- Remover de admin_users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users';
    END LOOP;
    
    -- Remover de store_customizations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'store_customizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations';
    END LOOP;
END $$;

-- 3. Reabilitar RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- 4. Criar política CRÍTICA para stores (INSERT)
CREATE POLICY "Allow authenticated to create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Criar política CRÍTICA para admin_users (INSERT)
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 6. Criar política CRÍTICA para store_customizations (INSERT)
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Criar outras políticas necessárias

-- SELECT para stores
CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- SELECT para admin_users
CREATE POLICY "Admins can view their own admin user"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- SELECT para store_customizations
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- UPDATE para stores
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
)
WITH CHECK (
  id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- UPDATE para admin_users
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- UPDATE para store_customizations
CREATE POLICY "Admins can update their store customizations"
ON store_customizations FOR UPDATE
TO authenticated
USING (
  store_id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
)
WITH CHECK (
  store_id IN (SELECT store_id FROM admin_users WHERE id = auth.uid())
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar se as políticas foram criadas:
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- Você deve ver 3 políticas INSERT:
-- ✅ Allow authenticated to create stores
-- ✅ Allow authenticated to create admin user
-- ✅ Allow authenticated to create customizations

