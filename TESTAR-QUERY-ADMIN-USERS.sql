-- ============================================
-- TESTAR QUERY admin_users
-- ============================================
-- Este script testa se a query funciona
-- diretamente no banco de dados
-- ============================================

\set user_id '68e03031-1b9f-4080-a7ae-0a2a5981a765'
\set user_email 'kotthz@proton.me'

-- 1. Verificar se o usuário existe
SELECT 
    'Verificação' as teste,
    CASE 
        WHEN EXISTS(SELECT 1 FROM admin_users WHERE id = :'user_id'::uuid) 
        THEN '✅ Usuário encontrado'
        ELSE '❌ Usuário NÃO encontrado'
    END as resultado;

-- 2. Testar query simples (sem RLS - como superuser)
SELECT 
    'Query simples' as teste,
    id,
    email,
    store_id,
    role
FROM admin_users
WHERE id = :'user_id'::uuid;

-- 3. Verificar políticas RLS
SELECT 
    'Políticas RLS' as teste,
    policyname,
    cmd as operacao,
    roles,
    qual as condicao_using
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'admin_users'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
    'Status RLS' as teste,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'admin_users';

-- 5. Testar se a política permite a leitura (simulação)
-- NOTA: Isso só funciona no contexto de uma sessão autenticada
-- Mas podemos verificar a estrutura da política
SELECT 
    'Estrutura da Política SELECT' as teste,
    policyname,
    'USING (id = auth.uid())' as condicao_esperada,
    qual as condicao_atual,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ Condição correta'
        ELSE '⚠️ Condição pode estar incorreta'
    END as status
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'admin_users'
AND cmd = 'SELECT';

-- 6. Verificar índices (pode afetar performance)
SELECT 
    'Índices' as teste,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'admin_users';

-- 7. Verificar estatísticas da tabela
SELECT 
    'Estatísticas' as teste,
    n_live_tup as total_linhas,
    n_dead_tup as linhas_mortas,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND relname = 'admin_users';

-- 8. Verificar se há locks na tabela
SELECT 
    'Locks' as teste,
    locktype,
    mode,
    granted,
    pid,
    relation::regclass as tabela
FROM pg_locks
WHERE relation = 'admin_users'::regclass::oid;



