-- ============================================
-- VERIFICAR E CORRIGIR RLS PARA PRODUTOS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para verificar e corrigir políticas RLS de produtos
-- ============================================

-- 1. Verificar políticas RLS atuais de produtos
SELECT 
    'POLÍTICAS RLS - PRODUCTS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'products'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
    'RLS STATUS - PRODUCTS' as tipo,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- 3. Se não houver política INSERT, criar uma
DO $$
BEGIN
    -- Verificar se já existe política INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND cmd = 'INSERT'
    ) THEN
        -- Criar política INSERT para admins
        CREATE POLICY "Admins can insert products"
        ON products FOR INSERT
        TO authenticated
        WITH CHECK (
            store_id IN (
                SELECT store_id FROM admin_users 
                WHERE id = auth.uid()
            )
        );
        RAISE NOTICE 'Política INSERT criada para products';
    ELSE
        RAISE NOTICE 'Política INSERT já existe para products';
    END IF;
END $$;

-- 4. Verificar se há política UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND cmd = 'UPDATE'
    ) THEN
        -- Criar política UPDATE para admins
        CREATE POLICY "Admins can update products"
        ON products FOR UPDATE
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
        RAISE NOTICE 'Política UPDATE criada para products';
    ELSE
        RAISE NOTICE 'Política UPDATE já existe para products';
    END IF;
END $$;

-- 5. Verificar se há política DELETE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND cmd = 'DELETE'
    ) THEN
        -- Criar política DELETE para admins
        CREATE POLICY "Admins can delete products"
        ON products FOR DELETE
        TO authenticated
        USING (
            store_id IN (
                SELECT store_id FROM admin_users 
                WHERE id = auth.uid()
            )
        );
        RAISE NOTICE 'Política DELETE criada para products';
    ELSE
        RAISE NOTICE 'Política DELETE já existe para products';
    END IF;
END $$;

-- 6. Verificar políticas finais
SELECT 
    'POLÍTICAS FINAIS - PRODUCTS' as tipo,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'products'
ORDER BY cmd, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve haver pelo menos:
-- 1. SELECT: "Public can view active products" (anon, authenticated)
-- 2. INSERT: "Admins can insert products" (authenticated)
-- 3. UPDATE: "Admins can update products" (authenticated)
-- 4. DELETE: "Admins can delete products" (authenticated)
-- OU
-- 1. SELECT: "Public can view active products"
-- 2. ALL: "Admins can manage their store products" (cobre INSERT, UPDATE, DELETE)
-- ============================================




