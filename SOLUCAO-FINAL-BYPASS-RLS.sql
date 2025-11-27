-- ============================================
-- SOLUÇÃO FINAL: Bypass RLS usando função SQL
-- ============================================
-- Esta solução cria uma função que bypassa RLS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Criar função para inserir loja (bypass RLS)
CREATE OR REPLACE FUNCTION public.insert_store(
    p_name VARCHAR(255),
    p_slug VARCHAR(100),
    p_owner_email VARCHAR(255),
    p_owner_name VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Inserir loja (bypass RLS porque usa SECURITY DEFINER)
    INSERT INTO stores (
        name,
        slug,
        owner_email,
        owner_name,
        subscription_status
    ) VALUES (
        p_name,
        p_slug,
        p_owner_email,
        p_owner_name,
        'active'
    )
    RETURNING id INTO v_store_id;
    
    RETURN v_store_id;
END;
$$;

-- 2. Garantir que usuários autenticados podem executar
GRANT EXECUTE ON FUNCTION public.insert_store TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store TO anon;

-- 3. Verificar se a função foi criada
SELECT 
    'FUNÇÃO CRIADA' as tipo,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'insert_store';

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- A função insert_store foi criada e pode ser usada
-- para inserir lojas sem problemas de RLS
-- ============================================

