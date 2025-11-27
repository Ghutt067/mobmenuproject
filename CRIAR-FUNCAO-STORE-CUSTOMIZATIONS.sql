-- ============================================
-- CRIAR FUNÇÃO PARA STORE_CUSTOMIZATIONS
-- ============================================
-- Esta função bypassa RLS para inserir em store_customizations
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar função para inserir store_customizations (bypass RLS)
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
    -- Inserir store_customizations (bypass RLS porque usa SECURITY DEFINER)
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

-- Garantir que usuários autenticados podem executar
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO anon;

-- Verificar se a função foi criada
SELECT 
    'FUNÇÃO STORE_CUSTOMIZATIONS CRIADA' as tipo,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'insert_store_customizations';

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- A função insert_store_customizations foi criada
-- ============================================

