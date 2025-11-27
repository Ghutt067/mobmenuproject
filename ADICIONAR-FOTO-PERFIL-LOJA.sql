-- ============================================
-- ADICIONAR CAMPO DE FOTO DE PERFIL DA LOJA
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Adiciona campo para foto de perfil que aparece no checkout
-- ============================================

-- Adicionar coluna na tabela store_customizations (se não existir)
ALTER TABLE store_customizations 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN store_customizations.profile_image_url IS 'URL da foto de perfil da loja exibida no checkout/identificação';

