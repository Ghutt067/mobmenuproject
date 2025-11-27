-- Adicionar coluna show_buy_button na tabela store_customizations
-- Esta coluna controla se o botão de comprar deve ser exibido nos cards dos produtos

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'show_buy_button'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN show_buy_button BOOLEAN DEFAULT true;
    
    -- Atualizar registros existentes para true (padrão)
    UPDATE store_customizations 
    SET show_buy_button = true 
    WHERE show_buy_button IS NULL;
    
    RAISE NOTICE 'Coluna show_buy_button adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna show_buy_button já existe.';
  END IF;
END $$;

