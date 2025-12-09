-- ============================================
-- REMOVER VALORES DEFAULT DO BANCO DE DADOS
-- ============================================
-- Este script remove os valores DEFAULT das personalizações
-- que eram do FÉQUEIJAO, substituindo por valores genéricos
-- ============================================

-- PASSO 1: Alterar os valores DEFAULT na tabela store_customizations

-- Remover os valores DEFAULT atuais (FÉQUEIJAO)
ALTER TABLE store_customizations 
  ALTER COLUMN promo_banner_text DROP DEFAULT,
  ALTER COLUMN promo_banner_bg_color DROP DEFAULT,
  ALTER COLUMN primary_color DROP DEFAULT,
  ALTER COLUMN secondary_color DROP DEFAULT;

-- Adicionar novos valores DEFAULT genéricos (opcional - pode deixar sem DEFAULT)
ALTER TABLE store_customizations 
  ALTER COLUMN promo_banner_text SET DEFAULT '',
  ALTER COLUMN promo_banner_bg_color SET DEFAULT '#E8E8E8',
  ALTER COLUMN primary_color SET DEFAULT '#808080',
  ALTER COLUMN secondary_color SET DEFAULT '#2C3E50';

-- PASSO 2: Atualizar registros existentes que têm os valores do FÉQUEIJAO
UPDATE store_customizations
SET 
  promo_banner_text = CASE 
    WHEN promo_banner_text = 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF' THEN ''
    ELSE promo_banner_text
  END,
  promo_banner_bg_color = CASE 
    WHEN promo_banner_bg_color = '#FDD8A7' THEN '#E8E8E8'
    ELSE promo_banner_bg_color
  END,
  primary_color = CASE 
    WHEN primary_color = '#FF6B35' THEN '#808080'
    ELSE primary_color
  END,
  secondary_color = CASE 
    WHEN secondary_color = '#004E89' THEN '#2C3E50'
    ELSE secondary_color
  END
WHERE 
  promo_banner_text = 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF'
  OR promo_banner_bg_color = '#FDD8A7'
  OR primary_color = '#FF6B35'
  OR secondary_color = '#004E89';

-- PASSO 3: Verificar se foi atualizado (deve retornar VAZIO)
SELECT 
  id,
  promo_banner_text,
  promo_banner_bg_color,
  primary_color,
  secondary_color
FROM store_customizations
WHERE 
  promo_banner_text = 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF'
  OR promo_banner_bg_color = '#FDD8A7'
  OR primary_color = '#FF6B35'
  OR secondary_color = '#004E89';

-- Se retornar VAZIO, está tudo atualizado! ✅
