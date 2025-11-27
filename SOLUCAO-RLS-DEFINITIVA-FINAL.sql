-- ============================================
-- 🔥 SOLUÇÃO DEFINITIVA RLS - EXECUTE AGORA!
-- ============================================
-- Este script RESOLVE o erro 42501 definitivamente
-- Execute no Supabase SQL Editor
-- ============================================

-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLÍTICAS EXISTENTES (MÉTODO ROBUSTO)
DO $$ 
DECLARE 
    r RECORD;
    policy_count INTEGER;
BEGIN
    -- Remover políticas de stores
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stores'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.stores CASCADE', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
    
    -- Remover políticas de admin_users
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_users'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users CASCADE', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
    
    -- Remover políticas de store_customizations
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'store_customizations'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.store_customizations CASCADE', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
    
    -- Verificar se todas foram removidas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('stores', 'admin_users', 'store_customizations');
    
    RAISE NOTICE 'Políticas restantes: %', policy_count;
END $$;

-- PASSO 3: REABILITAR RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- PASSO 4: CRIAR POLÍTICAS INSERT (NOMES SIMPLES, SEM ESPAÇOS)
-- ⚠️ CRÍTICO: Estas políticas permitem INSERT para usuários autenticados

-- STORES: INSERT (PERMISSIVA)
DROP POLICY IF EXISTS stores_insert_authenticated ON public.stores;
CREATE POLICY stores_insert_authenticated
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ADMIN_USERS: INSERT (PERMISSIVA)
DROP POLICY IF EXISTS admin_users_insert_authenticated ON public.admin_users;
CREATE POLICY admin_users_insert_authenticated
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- STORE_CUSTOMIZATIONS: INSERT (PERMISSIVA)
DROP POLICY IF EXISTS store_customizations_insert_authenticated ON public.store_customizations;
CREATE POLICY store_customizations_insert_authenticated
ON public.store_customizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PASSO 5: CRIAR POLÍTICAS SELECT (PARA LEITURA)

-- STORES: SELECT (Público pode ver lojas ativas)
DROP POLICY IF EXISTS stores_select_public ON public.stores;
CREATE POLICY stores_select_public
ON public.stores
FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

-- STORES: SELECT (Admins podem ver sua própria loja)
DROP POLICY IF EXISTS stores_select_own ON public.stores;
CREATE POLICY stores_select_own
ON public.stores
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT store_id 
        FROM admin_users 
        WHERE id = auth.uid()
    )
);

-- ADMIN_USERS: SELECT (Admins podem ver seu próprio registro)
DROP POLICY IF EXISTS admin_users_select_own ON public.admin_users;
CREATE POLICY admin_users_select_own
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- STORE_CUSTOMIZATIONS: SELECT (Público pode ver)
DROP POLICY IF EXISTS store_customizations_select_public ON public.store_customizations;
CREATE POLICY store_customizations_select_public
ON public.store_customizations
FOR SELECT
TO anon, authenticated
USING (true);

-- PASSO 6: VERIFICAÇÃO OBRIGATÓRIA
-- Execute esta query e verifique se retorna 3 políticas INSERT

SELECT 
    'VERIFICAÇÃO INSERT' as tipo,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
AND cmd = 'INSERT'
ORDER BY tablename;

-- Deve retornar:
-- stores | stores_insert_authenticated | INSERT | {authenticated}
-- admin_users | admin_users_insert_authenticated | INSERT | {authenticated}
-- store_customizations | store_customizations_insert_authenticated | INSERT | {authenticated}

-- PASSO 7: VERIFICAR RLS HABILITADO
SELECT 
    'RLS STATUS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename;

-- Deve retornar:
-- stores | true
-- admin_users | true
-- store_customizations | true

-- ============================================
-- ✅ APÓS EXECUTAR ESTE SCRIPT:
-- ============================================
-- 1. Verifique se as 3 políticas INSERT aparecem na verificação
-- 2. Verifique se RLS está habilitado (true) nas 3 tabelas
-- 3. Teste o cadastro novamente
-- 4. Se ainda der erro, limpe o cache do navegador (Ctrl+Shift+Del)
-- ============================================

