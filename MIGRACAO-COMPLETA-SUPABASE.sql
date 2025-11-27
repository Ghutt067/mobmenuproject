-- ============================================
-- MIGRAÇÃO COMPLETA PARA NOVA CONTA SUPABASE
-- ============================================
-- Este script contém TUDO necessário para configurar
-- o banco de dados na nova conta do Supabase
-- ============================================
-- INSTRUÇÕES:
-- 1. Acesse a NOVA conta do Supabase
-- 2. Vá em SQL Editor
-- 3. Delete TODOS os queries existentes
-- 4. Copie TODO este arquivo
-- 5. Cole no SQL Editor
-- 6. Execute (Run ou F5)
-- 7. Verifique se não há erros
-- ============================================
-- IMPORTANTE: Após executar, atualize as credenciais
-- no arquivo src/lib/supabase.ts com as novas chaves
-- ============================================

-- ============================================
-- PARTE 1: HABILITAR EXTENSÕES NECESSÁRIAS
-- ============================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTE 2: CRIAR TABELAS PRINCIPAIS
-- ============================================

-- 1. Tabela de lojas (tenants)
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

-- 2. Tabela de usuários admin (donos de delivery)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabela de personalizações da loja
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

-- ============================================
-- PARTE 3: ADICIONAR store_id NAS TABELAS EXISTENTES
-- ============================================
-- (Se as tabelas products, sets, subsets já existirem)

-- Adicionar store_id em sets (se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sets' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE sets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      RAISE NOTICE 'Coluna store_id adicionada em sets';
    ELSE
      RAISE NOTICE 'Coluna store_id já existe em sets';
    END IF;
  END IF;
END $$;

-- Adicionar store_id em subsets (se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subsets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subsets' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE subsets ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      RAISE NOTICE 'Coluna store_id adicionada em subsets';
    ELSE
      RAISE NOTICE 'Coluna store_id já existe em subsets';
    END IF;
  END IF;
END $$;

-- Adicionar store_id em products (se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
      ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      RAISE NOTICE 'Coluna store_id adicionada em products';
    ELSE
      RAISE NOTICE 'Coluna store_id já existe em products';
    END IF;
  END IF;
END $$;

-- ============================================
-- PARTE 4: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para tabelas principais (sempre existem)
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_store_id ON admin_users(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON stores(subdomain);

-- Índices para tabelas que podem não existir (products, sets, subsets)
DO $$
BEGIN
  -- Índice para products (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'store_id') THEN
      CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
    END IF;
  END IF;
  
  -- Índice para sets (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sets') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sets' AND column_name = 'store_id') THEN
      CREATE INDEX IF NOT EXISTS idx_sets_store_id ON sets(store_id);
    END IF;
  END IF;
  
  -- Índice para subsets (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subsets') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subsets' AND column_name = 'store_id') THEN
      CREATE INDEX IF NOT EXISTS idx_subsets_store_id ON subsets(store_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- PARTE 5: CRIAR TRIGGER PARA has_discount
-- ============================================
-- (Se a tabela products existir e tiver has_discount)

-- Criar função para calcular has_discount (se products existir)
CREATE OR REPLACE FUNCTION calculate_has_discount()
RETURNS TRIGGER AS $$
DECLARE
  old_price_num NUMERIC;
  new_price_num NUMERIC;
BEGIN
  -- Se old_price está vazio ou null, não há desconto
  IF NEW.old_price IS NULL OR TRIM(NEW.old_price) = '' THEN
    NEW.has_discount := false;
    RETURN NEW;
  END IF;
  
  -- Se os preços são iguais, não há desconto
  IF NEW.old_price = NEW.new_price THEN
    NEW.has_discount := false;
    RETURN NEW;
  END IF;
  
  -- Tentar comparar valores numéricos
  BEGIN
    -- Remover formatação e converter para numérico
    old_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.old_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    new_price_num := CAST(
      REPLACE(REPLACE(REPLACE(NEW.new_price, 'R$', ''), '.', ''), ',', '.') AS NUMERIC
    );
    
    -- Há desconto se preço antigo > preço novo
    NEW.has_discount := old_price_num > new_price_num AND old_price_num > 0 AND new_price_num > 0;
  EXCEPTION WHEN OTHERS THEN
    -- Se não conseguir converter, não há desconto
    NEW.has_discount := false;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se products existir e tiver has_discount
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_discount') THEN
      -- Remover trigger antigo se existir
      DROP TRIGGER IF EXISTS trigger_calculate_has_discount ON products;
      
      -- Criar trigger
      EXECUTE 'CREATE TRIGGER trigger_calculate_has_discount
        BEFORE INSERT OR UPDATE OF old_price, new_price ON products
        FOR EACH ROW
        EXECUTE FUNCTION calculate_has_discount()';
      
      RAISE NOTICE 'Trigger has_discount criado';
    END IF;
  END IF;
END $$;

-- ============================================
-- PARTE 6: CONFIGURAR STORAGE
-- ============================================

-- Criar bucket de storage para assets das lojas (logos, imagens de produtos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas de storage (se existirem)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Política de storage: permitir upload apenas para usuários autenticados
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-assets');

-- Política de storage: permitir leitura pública
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-assets');

-- ============================================
-- PARTE 7: CRIAR FUNÇÕES SQL (BYPASS RLS)
-- ============================================

-- 1. Função para inserir loja
CREATE OR REPLACE FUNCTION public.insert_store(
    p_name VARCHAR(255),
    p_slug VARCHAR(100),
    p_owner_email VARCHAR(255),
    p_owner_name VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
BEGIN
    INSERT INTO stores (
        name,
        slug,
        owner_email,
        owner_name,
        subscription_status
    ) VALUES (
        p_name,
        p_slug,
        p_owner_email,
        p_owner_name,
        'active'
    )
    RETURNING id INTO v_store_id;
    
    RETURN v_store_id;
END;
$$;

-- 2. Função para inserir admin_user
CREATE OR REPLACE FUNCTION public.insert_admin_user(
    p_user_id UUID,
    p_store_id UUID,
    p_email VARCHAR(255),
    p_role VARCHAR(50) DEFAULT 'owner'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO admin_users (
        id,
        store_id,
        email,
        role
    ) VALUES (
        p_user_id,
        p_store_id,
        p_email,
        p_role
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN p_user_id;
END;
$$;

-- 3. Função para inserir store_customizations
CREATE OR REPLACE FUNCTION public.insert_store_customizations(
    p_store_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customization_id UUID;
BEGIN
    INSERT INTO store_customizations (
        store_id,
        promo_banner_visible,
        promo_banner_text,
        promo_banner_bg_color,
        promo_banner_text_color,
        promo_banner_use_gradient,
        primary_color,
        secondary_color,
        background_color,
        text_color,
        show_search,
        show_menu,
        show_cart
    ) VALUES (
        p_store_id,
        true,
        'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
        '#FDD8A7',
        '#000000',
        true,
        '#FF6B35',
        '#004E89',
        '#FFFFFF',
        '#000000',
        true,
        true,
        true
    )
    RETURNING id INTO v_customization_id;
    
    RETURN v_customization_id;
END;
$$;

-- Garantir permissões nas funções
GRANT EXECUTE ON FUNCTION public.insert_store TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store TO anon;
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_admin_user TO anon;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_store_customizations TO anon;

-- ============================================
-- PARTE 8: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

-- ============================================
-- TABELA: stores
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Admins can view their own store" ON stores;
DROP POLICY IF EXISTS "Allow authenticated to create stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Admins can update their own store" ON stores;

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

-- INSERT: QUALQUER usuário autenticado pode criar loja
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

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admins can view their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Admins can view their own admin user record" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated to create admin user" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can create their own admin user" ON admin_users;
DROP POLICY IF EXISTS "Admins can update their own admin user" ON admin_users;

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

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public can view store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Admins can manage their store customizations" ON store_customizations;
DROP POLICY IF EXISTS "Allow authenticated to create customizations" ON store_customizations;
DROP POLICY IF EXISTS "Authenticated users can create store customizations" ON store_customizations;

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
-- TABELA: products (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas (se existirem)
    DROP POLICY IF EXISTS "Public can view active products" ON products;
    DROP POLICY IF EXISTS "Admins can manage their store products" ON products;
    DROP POLICY IF EXISTS "Admins can insert products" ON products;
    DROP POLICY IF EXISTS "Admins can update products" ON products;
    DROP POLICY IF EXISTS "Admins can delete products" ON products;
    
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
    
    RAISE NOTICE 'RLS configurado para products';
  END IF;
END $$;

-- ============================================
-- TABELA: sets (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sets') THEN
    ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas (se existirem)
    DROP POLICY IF EXISTS "Public can view active sets" ON sets;
    DROP POLICY IF EXISTS "Admins can manage their store sets" ON sets;
    
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
    
    RAISE NOTICE 'RLS configurado para sets';
  END IF;
END $$;

-- ============================================
-- TABELA: subsets (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subsets') THEN
    ALTER TABLE subsets ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas (se existirem)
    DROP POLICY IF EXISTS "Public can view active subsets" ON subsets;
    DROP POLICY IF EXISTS "Admins can manage their store subsets" ON subsets;
    
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
    
    RAISE NOTICE 'RLS configurado para subsets';
  END IF;
END $$;

-- ============================================
-- PARTE 9: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar tabelas criadas
SELECT 
    'TABELAS CRIADAS' as tipo,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('stores', 'admin_users', 'store_customizations', 'products', 'sets', 'subsets')
ORDER BY table_name;

-- Verificar funções criadas
SELECT 
    'FUNÇÕES CRIADAS' as tipo,
    routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('insert_store', 'insert_admin_user', 'insert_store_customizations')
ORDER BY routine_name;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS' as tipo,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations', 'products', 'sets', 'subsets')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- ============================================
-- PRÓXIMOS PASSOS:
-- ============================================
-- 1. Atualize as credenciais no arquivo:
--    src/lib/supabase.ts
--    - supabaseUrl: Nova URL do projeto
--    - supabaseAnonKey: Nova chave anônima
--
-- 2. Configure Supabase Auth:
--    - Vá em Authentication → Settings
--    - DESABILITE "Email Confirmation" (Confirm email)
--    - HABILITE "Enable Email Signup"
--
-- 3. Teste o cadastro:
--    - Acesse /admin/register
--    - Crie uma nova loja
--    - Verifique se funciona
--
-- 4. Se tiver dados antigos para migrar:
--    - Exporte os dados da conta antiga
--    - Importe na nova conta usando o Supabase Dashboard
--    - Ou use scripts SQL de INSERT
-- ============================================

