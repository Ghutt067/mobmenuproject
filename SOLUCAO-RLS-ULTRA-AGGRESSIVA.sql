-- ============================================
-- 🔥 SOLUÇÃO ULTRA AGRESSIVA RLS
-- ============================================
-- Use esta solução SE a anterior não funcionou
-- Este script é MAIS AGRESSIVO e garante que funciona
-- ============================================

-- PASSO 1: DESABILITAR RLS COMPLETAMENTE
ALTER TABLE IF EXISTS public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_customizations DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLÍTICAS (MÉTODO ULTRA AGRESSIVO)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Remover TODAS as políticas de stores (incluindo as do sistema)
    FOR r IN (
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies 
        WHERE tablename = 'stores'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Política removida: %.%.%', r.schemaname, r.tablename, r.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover política %.%.%: %', r.schemaname, r.tablename, r.policyname, SQLERRM;
        END;
    END LOOP;
    
    -- Remover TODAS as políticas de admin_users
    FOR r IN (
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies 
        WHERE tablename = 'admin_users'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Política removida: %.%.%', r.schemaname, r.tablename, r.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover política %.%.%: %', r.schemaname, r.tablename, r.policyname, SQLERRM;
        END;
    END LOOP;
    
    -- Remover TODAS as políticas de store_customizations
    FOR r IN (
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies 
        WHERE tablename = 'store_customizations'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Política removida: %.%.%', r.schemaname, r.tablename, r.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover política %.%.%: %', r.schemaname, r.tablename, r.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- PASSO 3: GARANTIR QUE RLS ESTÁ DESABILITADO
ALTER TABLE IF EXISTS public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_customizations DISABLE ROW LEVEL SECURITY;

-- PASSO 4: REABILITAR RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_customizations ENABLE ROW LEVEL SECURITY;

-- PASSO 5: CRIAR POLÍTICAS INSERT (MÁXIMA PERMISSIVIDADE)
-- Usando nomes SEM espaços e SEM caracteres especiais

-- STORES: INSERT
DROP POLICY IF EXISTS stores_insert_authenticated ON public.stores;
CREATE POLICY stores_insert_authenticated
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ADMIN_USERS: INSERT
DROP POLICY IF EXISTS admin_users_insert_authenticated ON public.admin_users;
CREATE POLICY admin_users_insert_authenticated
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- STORE_CUSTOMIZATIONS: INSERT
DROP POLICY IF EXISTS store_customizations_insert_authenticated ON public.store_customizations;
CREATE POLICY store_customizations_insert_authenticated
ON public.store_customizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PASSO 6: CRIAR POLÍTICAS SELECT

-- STORES: SELECT público
DROP POLICY IF EXISTS stores_select_public ON public.stores;
CREATE POLICY stores_select_public
ON public.stores
FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

-- STORES: SELECT próprio
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

-- ADMIN_USERS: SELECT
DROP POLICY IF EXISTS admin_users_select_own ON public.admin_users;
CREATE POLICY admin_users_select_own
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- STORE_CUSTOMIZATIONS: SELECT
DROP POLICY IF EXISTS store_customizations_select_public ON public.store_customizations;
CREATE POLICY store_customizations_select_public
ON public.store_customizations
FOR SELECT
TO anon, authenticated
USING (true);

-- PASSO 7: VERIFICAÇÃO FINAL
SELECT 
    'VERIFICAÇÃO FINAL - POLÍTICAS INSERT' as tipo,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
AND cmd = 'INSERT'
ORDER BY tablename;

-- Deve retornar 3 linhas:
-- stores | stores_insert_authenticated | INSERT | {authenticated}
-- admin_users | admin_users_insert_authenticated | INSERT | {authenticated}
-- store_customizations | store_customizations_insert_authenticated | INSERT | {authenticated}

SELECT 
    'VERIFICAÇÃO FINAL - RLS STATUS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename;

-- Todas devem estar true

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- 1. Execute DIAGNOSTICO-RLS.sql para verificar
-- 2. Limpe o cache do navegador (Ctrl+Shift+Del)
-- 3. Teste o cadastro novamente
-- ============================================

