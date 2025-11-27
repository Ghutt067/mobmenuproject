-- ============================================
-- SETUP COMPLETO DO SUPABASE - EXECUTAR UMA VEZ
-- ============================================
-- Este é o ÚNICO arquivo SQL que você precisa executar
-- Ele contém TUDO na ordem correta:
-- 1. Criação de tabelas
-- 2. Índices
-- 3. Storage
-- 4. Políticas RLS corretas
-- ============================================
-- INSTRUÇÕES:
-- 1. Delete TODOS os queries do SQL Editor
-- 2. Copie TODO este arquivo
-- 3. Cole no SQL Editor do Supabase
-- 4. Execute (Run)
-- 5. Verifique se não há erros
-- ============================================

-- ============================================
-- PARTE 1: CRIAR TABELAS
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
-- PARTE 2: CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sets_store_id ON sets(store_id);
CREATE INDEX IF NOT EXISTS idx_subsets_store_id ON subsets(store_id);
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_store_id ON admin_users(store_id);

-- ============================================
-- PARTE 3: CONFIGURAR STORAGE
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
-- PARTE 4: REMOVER TODAS AS POLÍTICAS RLS ANTIGAS
-- ============================================

-- Desabilitar RLS temporariamente para limpar
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsets DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas de stores
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stores';
    END LOOP;
END $$;

-- Remover TODAS as políticas de admin_users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_users';
    END LOOP;
END $$;

-- Remover TODAS as políticas de store_customizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'store_customizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON store_customizations';
    END LOOP;
END $$;

-- Remover TODAS as políticas de products
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON products';
    END LOOP;
END $$;

-- Remover TODAS as políticas de sets
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sets') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON sets';
    END LOOP;
END $$;

-- Remover TODAS as políticas de subsets
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subsets') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON subsets';
    END LOOP;
END $$;

-- ============================================
-- PARTE 5: CRIAR POLÍTICAS RLS CORRETAS
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

-- SELECT: Admins podem ver sua própria loja (mesmo inativa)
CREATE POLICY "Admins can view their own store"
ON stores FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);

-- INSERT: QUALQUER usuário autenticado pode criar loja (SEM RESTRIÇÕES)
-- ⚠️ ESTA É A POLÍTICA CRÍTICA PARA PERMITIR CADASTRO
CREATE POLICY "Allow authenticated to create stores"
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
)
WITH CHECK (
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
CREATE POLICY "Admins can view their own admin user"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- INSERT: Usuários autenticados podem criar seu próprio registro admin
-- ⚠️ ESTA É A POLÍTICA CRÍTICA PARA PERMITIR CADASTRO
CREATE POLICY "Allow authenticated to create admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: Admins podem atualizar seu próprio registro
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- TABELA: store_customizations
-- ============================================

ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver customizações
CREATE POLICY "Public can view store customizations"
ON store_customizations FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Usuários autenticados podem criar customizações
-- ⚠️ ESTA É A POLÍTICA CRÍTICA PARA PERMITIR CADASTRO
CREATE POLICY "Allow authenticated to create customizations"
ON store_customizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admins podem atualizar customizações de sua loja
CREATE POLICY "Admins can update their store customizations"
ON store_customizations FOR UPDATE
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

-- DELETE: Admins podem deletar customizações de sua loja
CREATE POLICY "Admins can delete their store customizations"
ON store_customizations FOR DELETE
TO authenticated
USING (
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
-- PARTE 6: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations', 'products', 'sets', 'subsets')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations', 'products', 'sets', 'subsets')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- ✅ Após executar este script:
-- 
-- 1. Vá em Supabase Dashboard > Authentication > Settings
-- 2. DESABILITE "Email Confirmation" ou "Confirm email"
-- 3. Salve as configurações
-- 4. Teste o cadastro em: http://localhost:5173/admin/register
-- 
-- ⚠️ IMPORTANTE: A confirmação de email DEVE estar desabilitada!
-- ============================================

