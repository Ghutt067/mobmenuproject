-- ============================================
-- ADICIONAR CAMPO DE TEMA DO CHECKOUT
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Adiciona campo para escolher o tema do checkout (ecommerce ou local)
-- ============================================

-- Adicionar coluna na tabela store_customizations (se não existir)
ALTER TABLE store_customizations 
ADD COLUMN IF NOT EXISTS checkout_theme VARCHAR(20) DEFAULT 'ecommerce';

-- Comentário para documentação
COMMENT ON COLUMN store_customizations.checkout_theme IS 'Tema do checkout: "ecommerce" (com CEP) ou "local" (delivery local sem CEP)';

