-- ============================================
-- ATUALIZAR FUNÇÃO insert_store_customizations
-- ============================================
-- Esta função será atualizada para criar customizações VAZIAS
-- quando uma nova loja é criada
-- ============================================

-- Atualizar função para inserir customizações VAZIAS (sem valores padrão)
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
    -- Inserir store_customizations com valores VAZIOS/NULL
    -- O usuário deve configurar manualmente na primeira vez
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
        false,  -- Banner oculto por padrão
        '',     -- Texto vazio
        NULL,   -- Sem cor de fundo (será NULL)
        '#000000',  -- Texto preto (padrão genérico)
        true,   -- Usar gradiente
        NULL,   -- Sem cor primária (será NULL)
        NULL,   -- Sem cor secundária (será NULL)
        '#FFFFFF',  -- Fundo branco (padrão genérico)
        '#000000',  -- Texto preto (padrão genérico)
        true,   -- Mostrar busca
        true,   -- Mostrar menu
        true    -- Mostrar carrinho
    )
    RETURNING id INTO v_customization_id;
    
    RETURN v_customization_id;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO anon;

-- Verificar se a função foi atualizada
SELECT 
    'FUNÇÃO ATUALIZADA' as status,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'insert_store_customizations';

-- ============================================
-- ✅ APÓS EXECUTAR:
-- ============================================
-- Novas lojas criadas terão customizações VAZIAS
-- O usuário precisará configurar manualmente na primeira vez
-- ============================================

