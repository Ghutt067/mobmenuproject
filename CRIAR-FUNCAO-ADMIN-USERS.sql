-- ============================================
-- CRIAR FUNÇÃO PARA ADMIN_USERS
-- ============================================
-- Esta função bypassa RLS para inserir em admin_users
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar função para inserir admin_user (bypass RLS)
CREATE OR REPLACE FUNCTION public.insert_admin_user(
    p_user_id UUID,
    p_store_id UUID,
    p_email VARCHAR(255),
    p_role VARCHAR(50) DEFAULT 'owner'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir admin_user (bypass RLS porque usa SECURITY DEFINER)
    INSERT INTO admin_users (
        id,
        store_id,
        email,
        role
    ) VALUES (
        p_user_id,
        p_store_id,
        p_email,
        p_role
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN p_user_id;
END;
$$;

-- Garantir que usuários autenticados podem executar
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO anon;

-- Verificar se a função foi criada
SELECT 
    'FUNÇÃO ADMIN_USERS CRIADA' as tipo,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'insert_admin_user';

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- A função insert_admin_user foi criada e pode ser usada
-- para inserir admin_users sem problemas de RLS
-- ============================================

