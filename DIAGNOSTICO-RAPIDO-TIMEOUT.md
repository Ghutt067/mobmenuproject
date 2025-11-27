# 🔍 Diagnóstico Rápido - Timeout no Login

## 📊 Situação Atual

Baseado nos logs que você compartilhou:
```
🔐 Iniciando login... kotthz@proton.me
🔍 Buscando dados do usuário admin... 68e03031-1b9f-4080-a7ae-0a2a5981a765
⚠️ Timeout de segurança ativado após 15 segundos
```

**O problema:** A query para buscar dados do usuário na tabela `admin_users` está demorando mais de 8 segundos ou travando completamente.

## 🎯 Causas Possíveis

1. **❌ Usuário não existe na tabela `admin_users`** (mais provável)
2. **❌ Política RLS bloqueando a leitura**
3. **❌ Conexão lenta com o Supabase**
4. **❌ Query travando por algum motivo**

## ✅ Solução Rápida - Passo 1: Verificar se o Usuário Existe

Execute este SQL no **Supabase SQL Editor** (substitua o email se necessário):

```sql
-- Verificar se o usuário existe
SELECT 
    'auth.users' as origem,
    id,
    email,
    email_confirmed_at
FROM auth.users
WHERE email = 'kotthz@proton.me'

UNION ALL

SELECT 
    'admin_users' as origem,
    id,
    email,
    NULL as email_confirmed_at
FROM admin_users
WHERE email = 'kotthz@proton.me';
```

### Resultado Esperado:

**✅ Se o usuário EXISTE em ambos:**
- Você verá 2 linhas (uma de cada tabela)
- O problema pode ser RLS ou conexão

**❌ Se o usuário NÃO existe em `admin_users`:**
- Você verá apenas 1 linha (de `auth.users`)
- **SOLUÇÃO:** Execute o script abaixo para inserir o usuário

## 🔧 Solução Rápida - Passo 2: Inserir Usuário em admin_users

Se o usuário não existe em `admin_users`, execute este SQL:

```sql
-- IMPORTANTE: Execute apenas se o usuário NÃO existir em admin_users
-- Este script vai:
-- 1. Encontrar o usuário em auth.users
-- 2. Encontrar a loja associada (pelo email do owner)
-- 3. Inserir o usuário em admin_users

INSERT INTO admin_users (id, email, store_id, role)
SELECT 
    u.id,
    u.email,
    s.id as store_id,
    'admin' as role
FROM auth.users u
LEFT JOIN stores s ON s.owner_email = u.email
WHERE u.email = 'kotthz@proton.me'
  AND NOT EXISTS (
      SELECT 1 FROM admin_users au WHERE au.id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    store_id = COALESCE(EXCLUDED.store_id, admin_users.store_id),
    role = EXCLUDED.role;

-- Verificar se foi inserido
SELECT * FROM admin_users WHERE email = 'kotthz@proton.me';
```

## 🔧 Solução Rápida - Passo 3: Corrigir Políticas RLS

Execute o script `CORRIGIR-TIMEOUT-LOGIN.sql` no Supabase SQL Editor para garantir que as políticas RLS estão corretas.

## 🔍 Diagnóstico Avançado

Execute o script `VERIFICAR-USUARIO-ADMIN.sql` para um diagnóstico completo.

## 📝 Próximos Passos

1. **Execute o SQL de verificação** (Passo 1)
2. **Se o usuário não existir**, execute o SQL de inserção (Passo 2)
3. **Execute o script de correção RLS** (Passo 3)
4. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
5. **Tente fazer login novamente**
6. **Abra o Console (F12)** e veja os logs detalhados

## 🆘 Ainda Não Funciona?

Se após seguir todos os passos o problema persistir:

1. **Verifique o console do navegador** - agora há logs muito mais detalhados
2. **Copie todas as mensagens** que começam com 🔐, ✅, ❌, ⚠️, 🔍, 📊
3. **Verifique se o Supabase está online** em status.supabase.com
4. **Tente em outro navegador** ou modo anônimo



