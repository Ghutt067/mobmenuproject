-- Adicionar coluna show_fixed_button na tabela store_customizations
-- Esta coluna controla se o botão flutuante de adicionar deve ser exibido na página de detalhes do produto

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'show_fixed_button'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN show_fixed_button BOOLEAN DEFAULT true;
    
    -- Atualizar registros existentes para true (padrão)
    UPDATE store_customizations 
    SET show_fixed_button = true 
    WHERE show_fixed_button IS NULL;
    
    RAISE NOTICE 'Coluna show_fixed_button adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna show_fixed_button já existe.';
  END IF;
END $$;

