-- ============================================
-- CRIAR TABELA PRODUCTS COMPLETA
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para criar a tabela products com todas as
-- colunas necessárias e políticas RLS
-- ============================================

-- 1. Criar tabela products (se não existir)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas do produto
  image TEXT,
  title VARCHAR(255) NOT NULL,
  description1 TEXT,
  description2 TEXT,
  
  -- Preços
  old_price VARCHAR(50) DEFAULT '',
  new_price VARCHAR(50) NOT NULL,
  has_discount BOOLEAN DEFAULT false,
  
  -- Relacionamentos
  set_id UUID REFERENCES sets(id) ON DELETE SET NULL,
  subset_id UUID REFERENCES subsets(id) ON DELETE SET NULL,
  
  -- Informações adicionais
  full_description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  force_buy_button BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar store_id se a tabela já existir mas não tiver a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      -- Atualizar produtos existentes com uma loja padrão (se houver)
      UPDATE products 
      SET store_id = (SELECT id FROM stores LIMIT 1)
      WHERE store_id IS NULL;
      -- Tornar NOT NULL após atualizar
      ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;
      RAISE NOTICE 'Coluna store_id adicionada em products';
    END IF;
  END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_set_id ON products(set_id);
CREATE INDEX IF NOT EXISTS idx_products_subset_id ON products(subset_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- 6. Criar função para calcular has_discount automaticamente
CREATE OR REPLACE FUNCTION calculate_has_discount()
RETURNS TRIGGER AS $$
DECLARE
  old_price_num NUMERIC;
  new_price_num NUMERIC;
BEGIN
  -- Se old_price estiver vazio ou NULL, não há desconto
  IF NEW.old_price IS NULL OR TRIM(NEW.old_price) = '' THEN
    NEW.has_discount = false;
    RETURN NEW;
  END IF;
  
  -- Se os preços forem iguais, não há desconto
  IF NEW.old_price = NEW.new_price THEN
    NEW.has_discount = false;
    RETURN NEW;
  END IF;
  
  -- Tentar converter preços para numérico
  BEGIN
    old_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.old_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    new_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.new_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    
    -- Há desconto se o preço anterior for maior que o preço atual
    IF old_price_num > new_price_num AND old_price_num > 0 AND new_price_num > 0 THEN
      NEW.has_discount = true;
    ELSE
      NEW.has_discount = false;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se não conseguir converter, não há desconto
      NEW.has_discount = false;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para calcular has_discount
DROP TRIGGER IF EXISTS trigger_calculate_has_discount ON products;
CREATE TRIGGER trigger_calculate_has_discount
  BEFORE INSERT OR UPDATE OF old_price, new_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_has_discount();

-- 8. Habilitar RLS na tabela products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 9. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage their store products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- 10. Criar política para SELECT (público pode ver produtos ativos)
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 11. Criar política para SELECT (admins podem ver todos os produtos da sua loja)
CREATE POLICY "Admins can view their store products"
ON products FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 12. Criar política para INSERT (admins podem criar produtos na sua loja)
CREATE POLICY "Admins can insert their store products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 13. Criar política para UPDATE (admins podem atualizar produtos da sua loja)
CREATE POLICY "Admins can update their store products"
ON products FOR UPDATE
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 14. Criar política para DELETE (admins podem deletar produtos da sua loja)
CREATE POLICY "Admins can delete their store products"
ON products FOR DELETE
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 15. Verificar se a tabela foi criada corretamente
SELECT 
    'Verificação' as status,
    COUNT(*) as total_produtos,
    COUNT(DISTINCT store_id) as lojas_com_produtos
FROM products;

-- 16. Listar colunas da tabela products
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 17. Verificar políticas RLS criadas
SELECT 
    policyname,
    cmd as operacao,
    roles,
    qual as condicao_using,
    with_check as condicao_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;



