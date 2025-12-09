-- Adicionar coluna high_contrast_buttons na tabela store_customizations
-- Esta coluna controla se os botões devem usar alto contraste (preto/branco) ou a cor de texto da loja

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_customizations' AND column_name = 'high_contrast_buttons'
  ) THEN
    ALTER TABLE store_customizations 
    ADD COLUMN high_contrast_buttons BOOLEAN DEFAULT true;
    
    -- Atualizar registros existentes para true (padrão)
    UPDATE store_customizations 
    SET high_contrast_buttons = true 
    WHERE high_contrast_buttons IS NULL;
    
    RAISE NOTICE 'Coluna high_contrast_buttons adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna high_contrast_buttons já existe.';
  END IF;
END $$;



