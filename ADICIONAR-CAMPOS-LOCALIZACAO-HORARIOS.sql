-- ============================================
-- ADICIONAR CAMPOS DE LOCALIZAÇÃO E HORÁRIOS AVANÇADOS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Adiciona campos para localização validada, timezone, dias de funcionamento e modo de operação
-- ============================================

-- Adicionar colunas na tabela stores (se não existirem)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS operating_days JSONB,
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointment_only_mode BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN stores.city IS 'Cidade da loja';
COMMENT ON COLUMN stores.state IS 'Estado (UF) da loja';
COMMENT ON COLUMN stores.country IS 'País da loja';
COMMENT ON COLUMN stores.timezone IS 'Timezone da loja (ex: America/Sao_Paulo)';
COMMENT ON COLUMN stores.latitude IS 'Latitude da localização da loja';
COMMENT ON COLUMN stores.longitude IS 'Longitude da localização da loja';
COMMENT ON COLUMN stores.operating_days IS 'JSON com dias de funcionamento e horários. Ex: [{"day": "monday", "open": true, "openTime": "08:00", "closeTime": "18:00"}, ...]';
COMMENT ON COLUMN stores.is_closed IS 'Indica se a loja está fechada no momento';
COMMENT ON COLUMN stores.appointment_only_mode IS 'Indica se a loja está em modo somente agendamento';

-- Exemplo de estrutura para operating_days:
-- [
--   {
--     "day": "monday",
--     "open": true,
--     "openTime": "08:00",
--     "closeTime": "18:00"
--   },
--   {
--     "day": "tuesday",
--     "open": true,
--     "openTime": "08:00",
--     "closeTime": "18:00"
--   },
--   {
--     "day": "wednesday",
--     "open": true,
--     "openTime": "08:00",
--     "closeTime": "18:00"
--   },
--   {
--     "day": "thursday",
--     "open": true,
--     "openTime": "08:00",
--     "closeTime": "18:00"
--   },
--   {
--     "day": "friday",
--     "open": true,
--     "openTime": "08:00",
--     "closeTime": "18:00"
--   },
--   {
--     "day": "saturday",
--     "open": true,
--     "openTime": "09:00",
--     "closeTime": "13:00"
--   },
--   {
--     "day": "sunday",
--     "open": false,
--     "openTime": null,
--     "closeTime": null
--   }
-- ]

