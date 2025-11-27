-- ============================================
-- VERIFICAR POLÍTICAS INSERT
-- ============================================
-- Execute esta query para verificar se as políticas INSERT foram criadas
-- ============================================

SELECT 
    'POLÍTICAS INSERT' as tipo,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
AND cmd = 'INSERT'
ORDER BY tablename;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve retornar 3 linhas:
-- 1. stores | stores_insert_authenticated | INSERT | {authenticated}
-- 2. admin_users | admin_users_insert_authenticated | INSERT | {authenticated}
-- 3. store_customizations | store_customizations_insert_authenticated | INSERT | {authenticated}
-- ============================================
-- Se retornar 0 linhas, as políticas NÃO foram criadas!
-- ============================================

