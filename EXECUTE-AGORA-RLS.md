# 🔥 SOLUÇÃO DEFINITIVA RLS - EXECUTE AGORA!

## ❌ O Problema
Erro `42501: new row violates row-level security policy for table "stores"`

Isso significa que as políticas RLS estão bloqueando a inserção, mesmo com usuário autenticado.

## ✅ A Solução

### PASSO 1: Execute o Script SQL

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. **DELETE TODOS os queries** que estão lá
4. Abra o arquivo `SOLUCAO-RLS-DEFINITIVA-FINAL.sql`
5. **Copie TODO o conteúdo**
6. **Cole no SQL Editor**
7. Clique em **RUN** (ou F5)

### PASSO 2: Verifique o Resultado

Após executar, você deve ver 2 resultados:

#### Resultado 1: Políticas INSERT
Deve mostrar **3 políticas INSERT**:
- `stores` → `stores_insert_authenticated`
- `admin_users` → `admin_users_insert_authenticated`
- `store_customizations` → `store_customizations_insert_authenticated`

#### Resultado 2: RLS Habilitado
Deve mostrar **RLS habilitado (true)** nas 3 tabelas:
- `stores` → `true`
- `admin_users` → `true`
- `store_customizations` → `true`

### PASSO 3: Limpe o Cache do Navegador

1. Pressione **Ctrl + Shift + Del** (Windows) ou **Cmd + Shift + Del** (Mac)
2. Selecione **Cache** e **Cookies**
3. Clique em **Limpar dados**

### PASSO 4: Teste o Cadastro

1. Acesse: `http://localhost:5173/admin/register`
2. Preencha o formulário
3. Clique em **Cadastrar**

## ⚠️ Se Ainda Der Erro

### Verifique no Supabase:

1. Vá em **SQL Editor**
2. Execute esta query:

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations')
AND cmd = 'INSERT';
```

**Deve retornar 3 linhas!** Se não retornar, execute o script novamente.

### Verifique RLS:

```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'admin_users', 'store_customizations');
```

**Todas devem estar `true`!**

## 🎯 O Que Este Script Faz

1. **Remove TODAS as políticas antigas** (pode haver conflitos)
2. **Cria políticas novas com nomes simples** (sem espaços)
3. **Garante que INSERT funciona** para usuários autenticados
4. **Verifica se tudo está correto**

## 📝 Notas Importantes

- ✅ **Confirmação de email DEVE estar desabilitada** no Supabase
- ✅ Execute o script **UMA VEZ** e verifique os resultados
- ✅ Se houver erro no script, copie a mensagem de erro completa
- ✅ Limpe o cache do navegador após executar o script

---

**Execute o script `SOLUCAO-RLS-DEFINITIVA-FINAL.sql` AGORA!**

