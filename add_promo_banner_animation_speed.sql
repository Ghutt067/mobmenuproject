-- Adicionar campo promo_banner_animation_speed à tabela store_customizations
ALTER TABLE store_customizations 
ADD COLUMN IF NOT EXISTS promo_banner_animation_speed NUMERIC(3,1) DEFAULT 1;

