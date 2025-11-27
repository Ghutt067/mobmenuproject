-- ============================================
-- CORRIGIR TIMEOUT NO LOGIN - POLÍTICAS RLS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para garantir que as políticas RLS estão
-- configuradas corretamente para permitir
-- que usuários autenticados leiam seus próprios
-- dados na tabela admin_users
-- ============================================

-- 1. Verificar se a tabela admin_users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
        RAISE EXCEPTION 'Tabela admin_users não existe! Execute o script de migração primeiro.';
    END IF;
END $$;

-- 2. Habilitar RLS na tabela admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas existentes da tabela admin_users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_users'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- 4. Criar política para SELECT (CRÍTICA PARA LOGIN)
-- Permite que usuários autenticados vejam seu próprio registro
CREATE POLICY "Admins can view their own admin user record"
ON admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 5. Criar política para INSERT (para cadastro)
CREATE POLICY "Authenticated users can create their own admin user"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 6. Criar política para UPDATE
CREATE POLICY "Admins can update their own admin user"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 7. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'admin_users'
ORDER BY policyname;

-- 8. Verificar se há usuários na tabela admin_users
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(DISTINCT id) as usuarios_unicos,
    COUNT(DISTINCT store_id) as lojas_unicas
FROM admin_users;

-- 9. Listar todos os usuários admin (para debug)
SELECT 
    id,
    email,
    store_id,
    role,
    created_at
FROM admin_users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- TESTE: Verificar se um usuário específico
-- pode ler seus próprios dados
-- ============================================
-- Substitua 'USER_ID_AQUI' pelo ID do usuário
-- que está tendo problemas
-- ============================================
-- SELECT 
--     id,
--     email,
--     store_id,
--     role
-- FROM admin_users
-- WHERE id = 'USER_ID_AQUI';

