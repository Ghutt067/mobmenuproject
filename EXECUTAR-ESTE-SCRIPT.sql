-- ============================================
-- ⚠️ EXECUTE ESTE SCRIPT AGORA!
-- ============================================
-- Este é o script MAIS AGRESSIVO para corrigir RLS
-- Ele remove TUDO e recria do zero
-- ============================================

-- 1. DESABILITAR RLS
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'store_customizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations';
    END LOOP;
END $$;

-- 3. REABILITAR RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICA INSERT PARA STORES (CRÍTICA!)
CREATE POLICY "Allow authenticated to create stores"
ON stores FOR INSERT TO authenticated WITH CHECK (true);

-- 5. CRIAR POLÍTICA INSERT PARA ADMIN_USERS (CRÍTICA!)
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- 6. CRIAR POLÍTICA INSERT PARA STORE_CUSTOMIZATIONS (CRÍTICA!)
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT TO authenticated WITH CHECK (true);

-- 7. VERIFICAR
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('stores', 'admin_users', 'store_customizations') 
  AND cmd = 'INSERT';

-- ✅ Deve mostrar 3 políticas INSERT!

