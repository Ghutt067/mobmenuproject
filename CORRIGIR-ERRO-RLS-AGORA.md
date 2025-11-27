# 🚨 Corrigir Erro RLS AGORA

## ❌ Erro Atual
```
Erro de segurança: Não foi possível criar a loja. Execute o script SQL...
```

## ✅ Solução Rápida (3 Passos)

### **PASSO 1: Executar Script de Correção**

1. Abra o arquivo **`CORRIGIR-RLS-RAPIDO.sql`** neste projeto
2. **Copie TODO o conteúdo**
3. Vá em **Supabase Dashboard** → **SQL Editor**
4. **Cole** o código
5. Clique em **"Run"** ou pressione **Ctrl+Enter**
6. **Aguarde** a execução terminar
7. Verifique se aparece **"Success"** (sem erros)

---

### **PASSO 2: Verificar se Funcionou**

Execute esta query no SQL Editor para verificar:

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND cmd = 'INSERT'
ORDER BY tablename;
```

**Você DEVE ver estas 3 políticas:**

✅ `Allow authenticated to create stores` (stores)  
✅ `Allow authenticated to create admin user` (admin_users)  
✅ `Allow authenticated to create customizations` (store_customizations)

**Se NÃO aparecer todas as 3, execute o script novamente!**

---

### **PASSO 3: Testar o Cadastro**

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. Acesse `http://localhost:5173/admin/register`
3. **Abra o Console** (F12 → Console)
4. Faça um cadastro de teste
5. Veja os logs no console

**O que você deve ver no console:**
```
✅ Usuário autenticado: [uuid]
✅ Sessão ativa: Sim
✅ Criando loja para usuário: [uuid]
```

---

## 🔍 Se Ainda Der Erro

### Verificar Autenticação

No console do navegador, verifique se aparece:
- `✅ Usuário autenticado: [uuid]` → Se NÃO aparecer, o problema é de autenticação
- `✅ Sessão ativa: Sim` → Se aparecer "Não", o problema é de sessão

### Verificar Políticas RLS

Execute no SQL Editor:

```sql
-- Ver TODAS as políticas
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd;
```

**Verifique:**
- ✅ RLS está habilitado? (deve ter políticas)
- ✅ Existe política INSERT para cada tabela?
- ✅ A política INSERT permite `authenticated`?

### Verificar RLS Habilitado

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
  AND schemaname = 'public';
```

Todos devem mostrar `true` (RLS habilitado).

---

## 🆘 Se Nada Funcionar

### Opção 1: Executar Script Completo

Execute o arquivo **`SETUP-COMPLETO-SUPABASE.sql`** (mais completo, mas demora mais).

### Opção 2: Desabilitar RLS Temporariamente (APENAS PARA TESTE)

```sql
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations DISABLE ROW LEVEL SECURITY;
```

**Teste o cadastro.** Se funcionar, o problema é nas políticas. Reabilite RLS e execute o script de correção novamente.

**Reabilitar RLS:**
```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist Rápido

- [ ] Script `CORRIGIR-RLS-RAPIDO.sql` executado
- [ ] Verificação SQL mostra 3 políticas INSERT
- [ ] RLS está habilitado nas 3 tabelas
- [ ] Console mostra "Usuário autenticado"
- [ ] Console mostra "Sessão ativa: Sim"
- [ ] Teste de cadastro realizado

---

## ✅ Sucesso!

Se tudo estiver correto, o cadastro deve funcionar e você verá:
- ✅ Redirecionamento para `/admin/login?store=slug-da-loja`
- ✅ Mensagem de sucesso
- ✅ Poderá fazer login

**Pronto! 🎉**

