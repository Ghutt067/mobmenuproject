-- ============================================
-- ADICIONAR CAMPOS DE INFORMAÇÕES DA LOJA
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Adiciona campos para descrição, localização, horários e formas de pagamento
-- ============================================

-- Adicionar colunas na tabela stores (se não existirem)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10),
ADD COLUMN IF NOT EXISTS payment_methods JSONB;

-- Comentários para documentação
COMMENT ON COLUMN stores.description IS 'Descrição da loja';
COMMENT ON COLUMN stores.address IS 'Endereço/localização da loja';
COMMENT ON COLUMN stores.opening_hours IS 'Horários de funcionamento (ex: "Segunda a Sexta: 8h às 18h")';
COMMENT ON COLUMN stores.closing_time IS 'Horário de fechamento atual (ex: "18:00")';
COMMENT ON COLUMN stores.payment_methods IS 'Array JSON com formas de pagamento aceitas (ex: ["Dinheiro", "Cartão de Crédito", "PIX"])';

-- Exemplo de atualização para uma loja existente:
-- UPDATE stores 
-- SET 
--   description = 'Loja especializada em queijos artesanais',
--   address = 'Rua Exemplo, 123 - Centro',
--   opening_hours = 'Segunda a Sexta: 8h às 18h | Sábado: 8h às 14h',
--   closing_time = '18:00',
--   payment_methods = '["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX"]'::jsonb
-- WHERE slug = 'nomedaloja';

