# 🔧 Correção do Erro de RLS no Cadastro

## ❌ Erro Atual
```
new row violates row-level security policy for table "stores"
```

## 🎯 Causa do Problema
O Supabase está bloqueando a criação de novas lojas devido às políticas de Row Level Security (RLS).

## ✅ Solução Completa

### Passo 1: Desabilitar Confirmação de Email (IMPORTANTE!)

1. Acesse seu **Supabase Dashboard**
2. Vá em **Authentication** → **Settings**
3. Procure por **"Email Confirmation"** ou **"Confirm email"**
4. **DESABILITE** a confirmação de email
5. Salve as configurações

**Por quê?** Com a confirmação de email habilitada, o signUp não autentica o usuário imediatamente, causando o erro de RLS.

### Passo 2: Executar SQL de Correção RLS

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `fix-rls-cadastro.sql` neste projeto
4. **Copie todo o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **Run** ou **Execute**
7. Verifique se não há erros na execução

### Passo 3: Verificar Políticas

Execute este SQL para verificar se as políticas foram criadas corretamente:

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, policyname;
```

Você deve ver:
- ✅ `Allow authenticated to create stores` (INSERT em stores)
- ✅ `Allow authenticated to create admin user` (INSERT em admin_users)
- ✅ `Allow authenticated to create customizations` (INSERT em store_customizations)

## 🧪 Testar o Cadastro

Após seguir todos os passos acima:

1. Acesse `http://localhost:5173/admin/register`
2. Preencha o formulário:
   - **Nome da loja:** Minha Loja Teste
   - **Seu nome:** João Silva
   - **Email:** teste123@gmail.com
   - **Senha:** senha123
   - **Confirmar senha:** senha123
3. Clique em **Cadastrar**
4. Você deve ser redirecionado para o login com sucesso

## 🔍 Se ainda der erro...

### Verificar logs no Supabase

1. Vá em **Logs** → **Auth Logs** no Supabase Dashboard
2. Verifique se o signUp foi bem-sucedido
3. Vá em **Table Editor** → **auth.users**
4. Verifique se o usuário foi criado
5. Vá em **Logs** → **Postgres Logs**
6. Procure por erros relacionados a RLS

### Solução Alternativa Temporária

Se o problema persistir, você pode **TEMPORARIAMENTE** desabilitar RLS completamente:

```sql
-- ⚠️ APENAS PARA TESTES! NÃO USE EM PRODUÇÃO!
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;
```

Depois de testar, **REABILITE** RLS:

```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;
```

## 📋 Checklist de Verificação

- [ ] Confirmação de email desabilitada no Supabase
- [ ] SQL de correção RLS executado sem erros
- [ ] Políticas verificadas e criadas corretamente
- [ ] Teste de cadastro realizado com sucesso
- [ ] Login funciona após cadastro
- [ ] Dashboard carrega a loja correta do admin

## 💡 Dica

Se você está usando o Supabase em modo de desenvolvimento local, pode precisar executar os comandos SQL no seu banco local também.

## 🆘 Suporte Adicional

Se o problema persistir, verifique:
1. Se o projeto Supabase está no plano correto
2. Se há limites de API sendo excedidos
3. Se o banco de dados está respondendo corretamente
4. Logs do console do navegador (F12)

