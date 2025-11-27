-- ============================================
-- CRIAR TABELAS DE OPÇÕES DE PRODUTOS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para criar as tabelas de opções de produtos
-- ============================================

-- 1. Criar tabela product_option_groups
CREATE TABLE IF NOT EXISTS product_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  instruction VARCHAR(255) DEFAULT 'Escolha 1 opção',
  type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'multiple')),
  required BOOLEAN DEFAULT true,
  min_selections INTEGER DEFAULT 1,
  max_selections INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela product_options
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES product_option_groups(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  additional_price INTEGER DEFAULT 0, -- Preço em centavos
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_option_groups_product_id ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_option_groups_display_order ON product_option_groups(display_order);
CREATE INDEX IF NOT EXISTS idx_options_group_id ON product_options(group_id);
CREATE INDEX IF NOT EXISTS idx_options_display_order ON product_options(display_order);

-- 4. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_option_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_option_groups_updated_at ON product_option_groups;
CREATE TRIGGER trigger_update_option_groups_updated_at
  BEFORE UPDATE ON product_option_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_option_groups_updated_at();

DROP TRIGGER IF EXISTS trigger_update_options_updated_at ON product_options;
CREATE TRIGGER trigger_update_options_updated_at
  BEFORE UPDATE ON product_options
  FOR EACH ROW
  EXECUTE FUNCTION update_options_updated_at();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para product_option_groups
-- Política para SELECT: usuários autenticados podem ver opções de produtos da sua loja
CREATE POLICY "Users can view option groups of their store products"
  ON product_option_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE p.id = product_option_groups.product_id
      AND au.id = auth.uid()
    )
  );

-- Política para INSERT: usuários autenticados podem criar opções para produtos da sua loja
CREATE POLICY "Users can insert option groups for their store products"
  ON product_option_groups
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE p.id = product_option_groups.product_id
      AND au.id = auth.uid()
    )
  );

-- Política para UPDATE: usuários autenticados podem atualizar opções de produtos da sua loja
CREATE POLICY "Users can update option groups of their store products"
  ON product_option_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE p.id = product_option_groups.product_id
      AND au.id = auth.uid()
    )
  );

-- Política para DELETE: usuários autenticados podem deletar opções de produtos da sua loja
CREATE POLICY "Users can delete option groups of their store products"
  ON product_option_groups
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE p.id = product_option_groups.product_id
      AND au.id = auth.uid()
    )
  );

-- 8. Criar políticas RLS para product_options
-- Política para SELECT: usuários autenticados podem ver opções
CREATE POLICY "Users can view options of their store products"
  ON product_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_option_groups pog
      JOIN products p ON pog.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE pog.id = product_options.group_id
      AND au.id = auth.uid()
    )
  );

-- Política para INSERT: usuários autenticados podem criar opções
CREATE POLICY "Users can insert options for their store products"
  ON product_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_option_groups pog
      JOIN products p ON pog.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE pog.id = product_options.group_id
      AND au.id = auth.uid()
    )
  );

-- Política para UPDATE: usuários autenticados podem atualizar opções
CREATE POLICY "Users can update options of their store products"
  ON product_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_option_groups pog
      JOIN products p ON pog.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE pog.id = product_options.group_id
      AND au.id = auth.uid()
    )
  );

-- Política para DELETE: usuários autenticados podem deletar opções
CREATE POLICY "Users can delete options of their store products"
  ON product_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_option_groups pog
      JOIN products p ON pog.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      JOIN admin_users au ON s.id = au.store_id
      WHERE pog.id = product_options.group_id
      AND au.id = auth.uid()
    )
  );

