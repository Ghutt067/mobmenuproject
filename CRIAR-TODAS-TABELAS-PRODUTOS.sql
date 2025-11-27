-- ============================================
-- CRIAR TODAS AS TABELAS DE PRODUTOS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para criar as tabelas: products, sets, subsets
-- com todas as colunas e políticas RLS
-- ============================================

-- ============================================
-- 1. CRIAR TABELA SETS
-- ============================================

CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar store_id se a tabela já existir mas não tiver a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sets' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE sets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      UPDATE sets SET store_id = (SELECT id FROM stores LIMIT 1) WHERE store_id IS NULL;
      ALTER TABLE sets ALTER COLUMN store_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Índices para sets
CREATE INDEX IF NOT EXISTS idx_sets_store_id ON sets(store_id);
CREATE INDEX IF NOT EXISTS idx_sets_display_order ON sets(display_order);
CREATE INDEX IF NOT EXISTS idx_sets_is_active ON sets(is_active);

-- ============================================
-- 2. CRIAR TABELA SUBSETS
-- ============================================

CREATE TABLE IF NOT EXISTS subsets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar store_id se a tabela já existir mas não tiver a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subsets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subsets' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE subsets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      UPDATE subsets SET store_id = (SELECT id FROM stores LIMIT 1) WHERE store_id IS NULL;
      ALTER TABLE subsets ALTER COLUMN store_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Índices para subsets
CREATE INDEX IF NOT EXISTS idx_subsets_store_id ON subsets(store_id);
CREATE INDEX IF NOT EXISTS idx_subsets_set_id ON subsets(set_id);
CREATE INDEX IF NOT EXISTS idx_subsets_display_order ON subsets(display_order);
CREATE INDEX IF NOT EXISTS idx_subsets_is_active ON subsets(is_active);

-- ============================================
-- 3. CRIAR TABELA PRODUCTS
-- ============================================

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

-- Adicionar store_id se a tabela já existir mas não tiver a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      UPDATE products SET store_id = (SELECT id FROM stores LIMIT 1) WHERE store_id IS NULL;
      ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_set_id ON products(set_id);
CREATE INDEX IF NOT EXISTS idx_products_subset_id ON products(subset_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- ============================================
-- 4. TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_sets_updated_at ON sets;
CREATE TRIGGER trigger_update_sets_updated_at
  BEFORE UPDATE ON sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_subsets_updated_at ON subsets;
CREATE TRIGGER trigger_update_subsets_updated_at
  BEFORE UPDATE ON subsets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Função para calcular has_discount
CREATE OR REPLACE FUNCTION calculate_has_discount()
RETURNS TRIGGER AS $$
DECLARE
  old_price_num NUMERIC;
  new_price_num NUMERIC;
BEGIN
  IF NEW.old_price IS NULL OR TRIM(NEW.old_price) = '' THEN
    NEW.has_discount = false;
    RETURN NEW;
  END IF;
  
  IF NEW.old_price = NEW.new_price THEN
    NEW.has_discount = false;
    RETURN NEW;
  END IF;
  
  BEGIN
    old_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.old_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    new_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.new_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    
    IF old_price_num > new_price_num AND old_price_num > 0 AND new_price_num > 0 THEN
      NEW.has_discount = true;
    ELSE
      NEW.has_discount = false;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NEW.has_discount = false;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular has_discount
DROP TRIGGER IF EXISTS trigger_calculate_has_discount ON products;
CREATE TRIGGER trigger_calculate_has_discount
  BEFORE INSERT OR UPDATE OF old_price, new_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_has_discount();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS para SETS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active sets" ON sets;
CREATE POLICY "Public can view active sets"
ON sets FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage their store sets" ON sets;
CREATE POLICY "Admins can manage their store sets"
ON sets FOR ALL
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

-- RLS para SUBSETS
ALTER TABLE subsets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active subsets" ON subsets;
CREATE POLICY "Public can view active subsets"
ON subsets FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage their store subsets" ON subsets;
CREATE POLICY "Admins can manage their store subsets"
ON subsets FOR ALL
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

-- RLS para PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view their store products" ON products;
CREATE POLICY "Admins can view their store products"
ON products FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can insert their store products" ON products;
CREATE POLICY "Admins can insert their store products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update their store products" ON products;
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

DROP POLICY IF EXISTS "Admins can delete their store products" ON products;
CREATE POLICY "Admins can delete their store products"
ON products FOR DELETE
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar tabelas criadas
SELECT 
    'Verificação' as status,
    'sets' as tabela,
    COUNT(*) as total_registros
FROM sets
UNION ALL
SELECT 
    'Verificação' as status,
    'subsets' as tabela,
    COUNT(*) as total_registros
FROM subsets
UNION ALL
SELECT 
    'Verificação' as status,
    'products' as tabela,
    COUNT(*) as total_registros
FROM products;

-- Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    cmd as operacao
FROM pg_policies
WHERE tablename IN ('sets', 'subsets', 'products')
ORDER BY tablename, cmd, policyname;

