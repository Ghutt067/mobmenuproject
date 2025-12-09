-- Adicionar coluna featured_product_ids na tabela store_customizations
-- Esta coluna armazena um array de IDs dos produtos que aparecem na seção "Produtos em Destaque" abaixo do PromoBanner

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'featured_product_ids'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN featured_product_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    RAISE NOTICE 'Coluna featured_product_ids adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna featured_product_ids já existe.';
  END IF;
END $$;

