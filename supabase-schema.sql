-- ============================================
-- SCHEMA PARA SISTEMA MULTI-TENANT (SAAS)
-- ============================================
-- Este arquivo contém a estrutura de banco de dados
-- para suportar múltiplos assinantes (lojas)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Criar tabela de lojas (tenants)
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

-- 2. Criar tabela de usuários admin (donos de delivery)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela de personalizações da loja
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

-- 4. Adicionar store_id nas tabelas existentes (se ainda não existir)
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

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sets_store_id ON sets(store_id);
CREATE INDEX IF NOT EXISTS idx_subsets_store_id ON subsets(store_id);
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_store_id ON admin_users(store_id);

-- 6. Criar bucket de storage para assets das lojas (logos, imagens de produtos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Política de storage: permitir upload apenas para usuários autenticados
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-assets');

-- 8. Política de storage: permitir leitura pública
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-assets');

-- 9. Row Level Security (RLS) - Produtos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: Compradores podem ver produtos ativos de qualquer loja (leitura pública)
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Política: Admin só pode modificar produtos da sua loja
CREATE POLICY "Admins can manage their store products"
ON products FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 10. Row Level Security (RLS) - Sets
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sets"
ON sets FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage their store sets"
ON sets FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 11. Row Level Security (RLS) - Subsets
ALTER TABLE subsets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active subsets"
ON subsets FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage their store subsets"
ON subsets FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- 12. Row Level Security (RLS) - Store Customizations
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage their store customizations"
ON store_customizations FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- Política: Permitir que usuários autenticados criem customizações durante o cadastro
CREATE POLICY "Authenticated users can create store customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 13. Row Level Security (RLS) - Admin Users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política: Permitir que usuários autenticados criem seu próprio registro admin durante o cadastro
CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Política: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 14. Row Level Security (RLS) - Stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
TO anon, authenticated
USING (subscription_status = 'active');

CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- Política: Permitir que usuários autenticados criem lojas (para cadastro)
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Admins podem atualizar sua própria loja
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
-- DADOS DE EXEMPLO (OPCIONAL - PARA TESTES)
-- ============================================
-- Remova este bloco em produção ou após criar sua primeira loja

-- Criar loja de exemplo
INSERT INTO stores (id, name, slug, subdomain, owner_email, owner_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Queijaria Demo',
  'demo',
  'demo',
  'admin@demo.com',
  'Admin Demo'
) ON CONFLICT (slug) DO NOTHING;

-- Criar customização padrão para a loja de exemplo
INSERT INTO store_customizations (store_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (store_id) DO NOTHING;

-- Migrar produtos existentes para a loja de exemplo (se houver)
UPDATE products 
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

UPDATE sets 
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

UPDATE subsets 
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Configure Supabase Auth para permitir cadastro de usuários
-- 3. Crie um usuário admin via Supabase Auth
-- 4. Insira o usuário na tabela admin_users associando ao store_id
-- 5. Use o slug 'demo' para testar (ex: localhost:5173?store=demo)
-- ============================================

