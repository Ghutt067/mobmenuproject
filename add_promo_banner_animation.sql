-- Adicionar campo promo_banner_animation à tabela store_customizations
ALTER TABLE store_customizations 
ADD COLUMN IF NOT EXISTS promo_banner_animation VARCHAR(50) DEFAULT 'gradient';

