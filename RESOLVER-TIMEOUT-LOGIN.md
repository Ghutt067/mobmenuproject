# 🔧 Resolver Erro de Timeout no Login

## ❌ Erro Atual
```
Erro ao carregar dados do usuário: Error: Timeout ao buscar dados do usuário
```

## 🎯 Causa do Problema

O timeout está ocorrendo quando o sistema tenta buscar os dados do usuário na tabela `admin_users` após o login. Isso pode acontecer por:

1. **Políticas RLS bloqueando a leitura** - A política pode não estar permitindo que o usuário leia seu próprio registro
2. **Usuário não existe na tabela admin_users** - O usuário foi criado no auth, mas não foi inserido na tabela admin_users
3. **Conexão lenta** - A query está demorando mais de 2 segundos (agora aumentado para 10 segundos)
4. **Sessão não está totalmente ativa** - A sessão pode não estar pronta quando a query é executada

## ✅ Solução Passo a Passo

### Passo 1: Executar Script SQL para Corrigir RLS

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo **`CORRIGIR-TIMEOUT-LOGIN.sql`**
4. **Execute o script completo**
5. Verifique se as políticas foram criadas corretamente

### Passo 2: Verificar se o Usuário Existe na Tabela admin_users

Execute este SQL no Supabase SQL Editor (substitua o email pelo seu):

```sql
-- Verificar se o usuário existe em admin_users
SELECT 
    au.id,
    au.email,
    au.store_id,
    au.role,
    au.created_at
FROM admin_users au
WHERE au.email = 'SEU_EMAIL@exemplo.com';
```

**Se não retornar nenhuma linha:**
- O usuário não está cadastrado como administrador
- Você precisa fazer o cadastro novamente ou inserir manualmente na tabela

### Passo 3: Verificar se o Usuário Existe no Auth

Execute este SQL:

```sql
-- Verificar se o usuário existe em auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com';
```

**Se não retornar nenhuma linha:**
- O usuário não foi criado no sistema de autenticação
- Você precisa fazer o cadastro novamente

### Passo 4: Verificar Políticas RLS

Execute este SQL para ver todas as políticas da tabela admin_users:

```sql
SELECT 
    policyname,
    cmd as operacao,
    roles,
    qual as condicao_using,
    with_check as condicao_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'admin_users'
ORDER BY policyname;
```

**Deve ter 3 políticas:**
1. `Admins can view their own admin user record` - SELECT
2. `Authenticated users can create their own admin user` - INSERT
3. `Admins can update their own admin user` - UPDATE

### Passo 5: Testar Login Novamente

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+Delete`
   - Limpe cookies e cache
   - Ou use modo anônimo/privado

2. **Tente fazer login novamente**

3. **Abra o Console do Navegador (F12)** para ver os logs detalhados:
   - Procure por mensagens começando com 🔐, ✅, ❌, ⚠️
   - Isso vai ajudar a identificar exatamente onde está o problema

### Passo 6: Se Ainda Não Funcionar - Inserir Usuário Manualmente

Se o usuário existe no `auth.users` mas não existe no `admin_users`, você pode inserir manualmente:

```sql
-- IMPORTANTE: Substitua os valores abaixo pelos seus dados reais
-- Você precisa do ID do usuário de auth.users e o store_id

-- 1. Primeiro, encontre o ID do usuário e o store_id
SELECT 
    u.id as user_id,
    u.email,
    s.id as store_id,
    s.name as store_name
FROM auth.users u
LEFT JOIN stores s ON s.owner_email = u.email
WHERE u.email = 'SEU_EMAIL@exemplo.com';

-- 2. Se você tiver o user_id e store_id, insira na tabela admin_users
INSERT INTO admin_users (id, email, store_id, role)
VALUES (
    'USER_ID_AQUI',  -- ID do auth.users
    'SEU_EMAIL@exemplo.com',
    'STORE_ID_AQUI',  -- ID da loja
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    store_id = EXCLUDED.store_id,
    role = EXCLUDED.role;
```

## 🔍 Logs de Debug

O código agora tem logs detalhados. Quando você tentar fazer login, verá no console:

- `🔐 Iniciando login...` - Login iniciado
- `✅ SignIn bem-sucedido` - Autenticação OK
- `🔍 Buscando dados do usuário admin...` - Buscando na tabela admin_users
- `✅ Dados do usuário admin carregados` - Sucesso!
- `❌ Erro...` - Algum erro ocorreu (veja a mensagem)

## ⚠️ Problemas Comuns

### Erro: "Usuário não encontrado como administrador"
- **Causa:** Usuário não existe na tabela `admin_users`
- **Solução:** Execute o Passo 6 para inserir manualmente

### Erro: "Erro de permissão ao acessar dados do administrador"
- **Causa:** Política RLS bloqueando
- **Solução:** Execute o Passo 1 (script SQL)

### Erro: "Timeout ao buscar dados do usuário"
- **Causa:** Query demorando mais de 10 segundos
- **Soluções:**
  1. Verifique sua conexão com a internet
  2. Verifique se o Supabase está funcionando (status.supabase.com)
  3. Execute o Passo 1 para garantir que as políticas estão corretas

## 📝 Melhorias Implementadas

1. ✅ Timeout aumentado de 2 para 10 segundos
2. ✅ Verificação de sessão antes de fazer query
3. ✅ Logs detalhados para debug
4. ✅ Tratamento de erros específicos (RLS, usuário não encontrado, timeout)
5. ✅ Mensagens de erro mais claras

## 🆘 Ainda com Problemas?

Se após seguir todos os passos o problema persistir:

1. **Verifique o console do navegador** e copie todas as mensagens de erro
2. **Execute o script SQL de verificação** e copie os resultados
3. **Verifique se o Supabase está online** em status.supabase.com
4. **Tente em outro navegador** ou modo anônimo



