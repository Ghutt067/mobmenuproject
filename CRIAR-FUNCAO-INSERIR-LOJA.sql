-- ============================================
-- SOLUÇÃO ALTERNATIVA: Função SQL para inserir loja
-- ============================================
-- Esta função contorna problemas de RLS usando SECURITY DEFINER
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar função para inserir loja (bypass RLS temporariamente)
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
    -- Inserir loja
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

-- Garantir que usuários autenticados podem executar a função
GRANT EXECUTE ON FUNCTION public.insert_store TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store TO anon;

-- ============================================
-- TESTE A FUNÇÃO:
-- ============================================
-- SELECT public.insert_store(
--     'Teste',
--     'teste',
--     'teste@teste.com',
--     'Teste'
-- );
-- ============================================

