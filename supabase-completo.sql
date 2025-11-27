-- ============================================
-- SCHEMA COMPLETO + POLÍTICAS RLS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este arquivo contém TUDO: estrutura do banco + políticas RLS
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de lojas (tenants)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários admin (donos de delivery)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de personalizações da loja
CREATE TABLE IF NOT EXISTS store_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Header
  logo_url TEXT,
  logo_alt_text VARCHAR(255),
  
  -- Banner promocional
  promo_banner_visible BOOLEAN DEFAULT true,
  promo_banner_text TEXT DEFAULT 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
  promo_banner_bg_color VARCHAR(7) DEFAULT '#FDD8A7',
  promo_banner_text_color VARCHAR(7) DEFAULT '#000000',
  promo_banner_use_gradient BOOLEAN DEFAULT true,
  promo_banner_font_size VARCHAR(20),
  promo_banner_padding VARCHAR(20),
  promo_banner_text_align VARCHAR(10) DEFAULT 'center',
  
  -- Cores gerais
  primary_color VARCHAR(7) DEFAULT '#FF6B35',
  secondary_color VARCHAR(7) DEFAULT '#004E89',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#000000',
  
  -- Outras configurações
  show_search BOOLEAN DEFAULT true,
  show_menu BOOLEAN DEFAULT true,
  show_cart BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar store_id nas tabelas existentes (se ainda não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE sets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subsets' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE subsets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sets_store_id ON sets(store_id);
CREATE INDEX IF NOT EXISTS idx_subsets_store_id ON subsets(store_id);
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_store_id ON admin_users(store_id);

-- ============================================
-- 3. CONFIGURAR STORAGE
-- ============================================

-- Criar bucket de storage para assets das lojas
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: permitir upload apenas para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-assets');

-- Política de storage: permitir leitura pública
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-assets');

-- ============================================
-- 4. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
-- ============================================

-- Remover políticas da tabela stores
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Admins can view their own store" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Admins can update their own store" ON stores;

-- Remover políticas da tabela admin_users
DROP POLICY IF EXISTS "Admins can view their own admin user record" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can create their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Admins can update their own admin user" ON admin_users;

-- Remover políticas da tabela store_customizations
DROP POLICY IF EXISTS "Public can view store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Admins can manage their store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Authenticated users can create store customizations" ON store_customizations;

-- Remover políticas de produtos, sets e subsets (se existirem)
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage their store products" ON products;
DROP POLICY IF EXISTS "Public can view active sets" ON sets;
DROP POLICY IF EXISTS "Admins can manage their store sets" ON sets;
DROP POLICY IF EXISTS "Public can view active subsets" ON subsets;
DROP POLICY IF EXISTS "Admins can manage their store subsets" ON subsets;

-- ============================================
-- 5. CRIAR POLÍTICAS RLS CORRETAS
-- ============================================

-- ============================================
-- TABELA: stores
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver lojas ativas
CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

-- SELECT: Admins podem ver sua própria loja
CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- INSERT: Qualquer usuário autenticado pode criar loja (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admins podem atualizar sua própria loja
CREATE POLICY "Admins can update their own store"
ON stores FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- TABELA: admin_users
-- ============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins podem ver seu próprio registro
CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- INSERT: Usuários autenticados podem criar seu próprio registro admin (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- ============================================
-- TABELA: store_customizations
-- ============================================

ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver customizações
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Usuários autenticados podem criar customizações (PERMITE CADASTRO)
CREATE POLICY "Authenticated users can create store customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE/DELETE: Admins podem gerenciar customizações de sua loja
CREATE POLICY "Admins can manage their store customizations"
ON store_customizations FOR ALL
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

-- ============================================
-- TABELA: products
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT: Compradores podem ver produtos ativos de qualquer loja (leitura pública)
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ALL: Admin só pode modificar produtos da sua loja
CREATE POLICY "Admins can manage their store products"
ON products FOR ALL
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

-- ============================================
-- TABELA: sets
-- ============================================

ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver sets ativos
CREATE POLICY "Public can view active sets"
ON sets FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ALL: Admins podem gerenciar sets de sua loja
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

-- ============================================
-- TABELA: subsets
-- ============================================

ALTER TABLE subsets ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver subsets ativos
CREATE POLICY "Public can view active subsets"
ON subsets FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ALL: Admins podem gerenciar subsets de sua loja
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

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script:
-- 1. Configure Supabase Auth para permitir cadastro (desabilite confirmação de email)
-- 2. Teste o cadastro de uma nova loja
-- ============================================

