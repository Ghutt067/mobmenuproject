-- Adicionar coluna minimum_order_value na tabela store_customizations
-- Esta coluna armazena o valor mínimo do pedido em centavos

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'minimum_order_value'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN minimum_order_value INTEGER DEFAULT 0;
    
    -- Atualizar registros existentes para 0 (sem pedido mínimo)
    UPDATE store_customizations 
    SET minimum_order_value = 0 
    WHERE minimum_order_value IS NULL;
    
    RAISE NOTICE 'Coluna minimum_order_value adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna minimum_order_value já existe.';
  END IF;
END $$;

