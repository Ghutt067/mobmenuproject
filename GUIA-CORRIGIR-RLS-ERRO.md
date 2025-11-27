# 🔧 Guia Completo: Corrigir Erro RLS "new row violates row-level security policy"

## ❌ Erro
```
new row violates row-level security policy for table "stores"
```

## 🎯 Causa
As políticas de Row Level Security (RLS) no Supabase estão bloqueando a criação de novas lojas durante o cadastro.

## ✅ Solução Definitiva (5 Passos)

### ⚠️ IMPORTANTE: Execute os passos na ordem!

---

### **PASSO 1: Desabilitar Confirmação de Email** 🔴 CRÍTICO

1. Acesse seu **Supabase Dashboard**
2. Vá em **Authentication** → **Settings** (ou **Configuration**)
3. Procure por **"Email Confirmation"** ou **"Confirm email"**
4. **DESABILITE** esta opção (deve estar OFF/Desabilitado)
5. **Salve** as configurações

**Por quê?** Com confirmação de email ativa, o usuário não fica autenticado imediatamente após o signUp, causando o erro de RLS.

---

### **PASSO 2: Executar Script SQL de Correção**

1. Abra o arquivo **`SOLUCAO-RLS-DEFINITIVA.sql`** neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. Acesse **Supabase Dashboard** → **SQL Editor**
4. **Cole** o código completo no editor
5. Clique em **"Run"** ou **"Execute"** (ou pressione `Ctrl+Enter`)
6. **Aguarde** a execução terminar
7. Verifique se **NÃO há erros** na execução

**O que o script faz:**
- ✅ Desabilita RLS temporariamente
- ✅ Remove TODAS as políticas antigas
- ✅ Recria as políticas corretas
- ✅ Reabilita RLS
- ✅ Verifica se tudo está funcionando

---

### **PASSO 3: Verificar se as Políticas Foram Criadas**

Execute este SQL no Supabase SQL Editor para verificar:

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd, policyname;
```

**Você deve ver estas políticas:**

**Para `stores`:**
- ✅ `Public can view active stores` (SELECT)
- ✅ `Admins can view their own store` (SELECT)
- ✅ `Allow authenticated to create stores` (INSERT) ← **CRÍTICA**
- ✅ `Admins can update their own store` (UPDATE)

**Para `admin_users`:**
- ✅ `Admins can view their own admin user` (SELECT)
- ✅ `Allow authenticated to create admin user` (INSERT) ← **CRÍTICA**
- ✅ `Admins can update their own admin user` (UPDATE)

**Para `store_customizations`:**
- ✅ `Public can view store customizations` (SELECT)
- ✅ `Allow authenticated to create customizations` (INSERT) ← **CRÍTICA**
- ✅ `Admins can update their store customizations` (UPDATE)
- ✅ `Admins can delete their store customizations` (DELETE)

---

### **PASSO 4: Limpar Cache e Testar**

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+Delete`
   - Selecione "Cache" e "Cookies"
   - Clique em "Limpar dados"

2. **Ou use modo anônimo:**
   - Pressione `Ctrl+Shift+N` (Chrome) ou `Ctrl+Shift+P` (Firefox)
   - Acesse `http://localhost:5173/admin/register`

3. **Teste o cadastro:**
   - Preencha o formulário
   - Clique em "Cadastrar"
   - Deve funcionar sem erros!

---

### **PASSO 5: Verificar Logs (Se Ainda Der Erro)**

Se ainda der erro após seguir todos os passos:

1. **Abra o Console do Navegador** (F12)
2. Vá na aba **Console**
3. Tente fazer o cadastro novamente
4. Veja se há mensagens de erro específicas
5. Verifique se aparece: `"Usuário autenticado: [ID]"` e `"Criando loja para usuário: [ID]"`

6. **No Supabase Dashboard:**
   - Vá em **Logs** → **Postgres Logs**
   - Procure por erros relacionados a RLS
   - Vá em **Logs** → **Auth Logs**
   - Verifique se o signUp foi bem-sucedido

---

## 🔍 Troubleshooting

### Erro: "Policy already exists"

Se você ver este erro ao executar o SQL:
```
ERROR: policy "Allow authenticated to create stores" already exists
```

**Solução:** O script já remove as políticas antigas, mas se der erro, execute primeiro:

```sql
DROP POLICY IF EXISTS "Allow authenticated to create stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated to create admin user" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated to create customizations" ON store_customizations;
```

Depois execute o script completo novamente.

---

### Erro: "Permission denied"

Se você ver erro de permissão:
```
ERROR: permission denied to create policy
```

**Solução:** Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

---

### Erro Persiste Após Todos os Passos

1. **Verifique se RLS está habilitado:**
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND schemaname = 'public';
```

Todos devem mostrar `true` (RLS habilitado).

2. **Desabilite RLS temporariamente para teste:**
```sql
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;
```

**Teste o cadastro.** Se funcionar, o problema é nas políticas. Reabilite RLS e execute o script novamente.

3. **Reabilite RLS:**
```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist Final

Antes de testar o cadastro, verifique:

- [ ] Confirmação de email **DESABILITADA** no Supabase
- [ ] Script SQL **`SOLUCAO-RLS-DEFINITIVA.sql`** executado sem erros
- [ ] Todas as políticas verificadas e criadas (PASSO 3)
- [ ] RLS habilitado nas 3 tabelas (stores, admin_users, store_customizations)
- [ ] Cache do navegador limpo
- [ ] Console do navegador aberto para ver logs

---

## 💡 Dicas Importantes

1. **Sempre desabilite confirmação de email** em desenvolvimento
2. **Execute o script SQL completo** - não pule partes
3. **Verifique as políticas** após executar o script
4. **Use o console do navegador** para debug
5. **Aguarde alguns segundos** após executar o SQL antes de testar

---

## 🆘 Ainda com Problemas?

Se após seguir TODOS os passos o problema persistir:

1. **Compartilhe os logs do console** (F12 → Console)
2. **Compartilhe os logs do Supabase** (Dashboard → Logs)
3. **Verifique se está usando o Supabase correto** (projeto correto)
4. **Tente criar um novo projeto Supabase** e execute o script novamente

---

## ✅ Sucesso!

Se o cadastro funcionar, você verá:
- ✅ Redirecionamento para `/admin/login?store=slug-da-loja`
- ✅ Mensagem de sucesso
- ✅ Poderá fazer login e acessar o dashboard

**Parabéns! O problema foi resolvido! 🎉**

