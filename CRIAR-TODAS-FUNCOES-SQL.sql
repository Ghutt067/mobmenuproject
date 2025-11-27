-- ============================================
-- CRIAR TODAS AS FUNÇÕES SQL (BYPASS RLS)
-- ============================================
-- Execute este script para criar todas as funções de uma vez
-- ============================================

-- 1. Função para inserir loja
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

-- 2. Função para inserir admin_user
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

-- 3. Função para inserir store_customizations
CREATE OR REPLACE FUNCTION public.insert_store_customizations(
    p_store_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customization_id UUID;
BEGIN
    INSERT INTO store_customizations (
        store_id,
        promo_banner_visible,
        promo_banner_text,
        promo_banner_bg_color,
        promo_banner_text_color,
        promo_banner_use_gradient,
        primary_color,
        secondary_color,
        background_color,
        text_color,
        show_search,
        show_menu,
        show_cart
    ) VALUES (
        p_store_id,
        true,
        'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
        '#FDD8A7',
        '#000000',
        true,
        '#FF6B35',
        '#004E89',
        '#FFFFFF',
        '#000000',
        true,
        true,
        true
    )
    RETURNING id INTO v_customization_id;
    
    RETURN v_customization_id;
END;
$$;

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION public.insert_store TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store TO anon;
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO anon;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO anon;

-- 5. Verificar se todas as funções foram criadas
SELECT 
    'FUNÇÕES CRIADAS' as tipo,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('insert_store', 'insert_admin_user', 'insert_store_customizations')
ORDER BY routine_name;

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- Deve mostrar 3 funções:
-- 1. insert_store
-- 2. insert_admin_user
-- 3. insert_store_customizations
-- ============================================

