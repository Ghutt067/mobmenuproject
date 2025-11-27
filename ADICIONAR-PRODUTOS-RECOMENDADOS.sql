-- Adicionar coluna recommended_product_ids na tabela store_customizations
-- Esta coluna armazena um array de IDs dos produtos que aparecem na seção "Peça também" do checkout

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'recommended_product_ids'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN recommended_product_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    RAISE NOTICE 'Coluna recommended_product_ids adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna recommended_product_ids já existe.';
  END IF;
END $$;

