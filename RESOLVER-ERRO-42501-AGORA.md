# 🔥 RESOLVER ERRO 42501 - PASSO A PASSO

## ❌ O Problema
Erro `42501: new row violates row-level security policy for table "stores"`

Mesmo com autenticação funcionando, as políticas RLS estão bloqueando a inserção.

---

## 📋 SOLUÇÃO EM 3 PASSOS

### PASSO 1: DIAGNÓSTICO (Execute Primeiro)

1. Abra o **Supabase Dashboard** → **SQL Editor**
2. **Delete tudo** que está no editor
3. Abra o arquivo **`DIAGNOSTICO-RLS.sql`**
4. **Copie TODO o conteúdo** e cole no SQL Editor
5. Clique em **RUN**
6. **Anote os resultados** (quantas políticas INSERT existem?)

**O que você deve ver:**
- Se aparecer **0 políticas INSERT** → As políticas não foram criadas
- Se aparecer **menos de 3 políticas INSERT** → Faltam políticas
- Se aparecer **3 políticas INSERT** mas ainda dá erro → Problema de permissões

---

### PASSO 2: EXECUTAR SOLUÇÃO ULTRA AGRESSIVA

1. No **SQL Editor**, **delete tudo** novamente
2. Abra o arquivo **`SOLUCAO-RLS-ULTRA-AGGRESSIVA.sql`**
3. **Copie TODO o conteúdo** e cole no SQL Editor
4. Clique em **RUN**
5. **Aguarde** a execução terminar
6. Verifique se apareceram **2 resultados**:
   - Resultado 1: **3 políticas INSERT** (stores, admin_users, store_customizations)
   - Resultado 2: **RLS habilitado (true)** nas 3 tabelas

**Se aparecer erro ao executar:**
- Copie a mensagem de erro completa
- Pode ser que alguma política não existe ainda (isso é normal, o script tenta remover mesmo assim)

---

### PASSO 3: VERIFICAR E TESTAR

1. **Execute o diagnóstico novamente** (PASSO 1)
2. Agora deve mostrar **3 políticas INSERT**
3. **Limpe o cache do navegador:**
   - Pressione **Ctrl + Shift + Del**
   - Selecione **Cache** e **Cookies**
   - Clique em **Limpar dados**
4. **Feche e abra o navegador novamente**
5. Teste o cadastro em: `http://localhost:5173/admin/register`

---

## 🔍 SE AINDA NÃO FUNCIONAR

### Verificação Adicional no Supabase:

1. Vá em **Authentication** → **Settings**
2. Verifique se **"Email Confirmation"** está **DESABILITADO**
3. Se estiver habilitado, **DESABILITE** e salve

### Verificar Políticas Manualmente:

Execute esta query no SQL Editor:

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
AND cmd = 'INSERT';
```

**Deve retornar 1 linha:**
- `stores` | `stores_insert_authenticated` | `INSERT` | `{authenticated}`

### Verificar RLS:

```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'stores';
```

**Deve retornar:**
- `stores` | `true`

---

## ⚠️ POSSÍVEIS CAUSAS

1. **Políticas não foram criadas** → Execute `SOLUCAO-RLS-ULTRA-AGGRESSIVA.sql`
2. **RLS não está habilitado** → O script habilita automaticamente
3. **Cache do navegador** → Limpe o cache (Ctrl+Shift+Del)
4. **Sessão expirada** → Feche e abra o navegador
5. **Email confirmation habilitado** → Desabilite no Supabase

---

## ✅ RESULTADO ESPERADO

Após executar tudo:
- ✅ 3 políticas INSERT criadas
- ✅ RLS habilitado nas 3 tabelas
- ✅ Cadastro funciona sem erro 42501

---

**Execute os 3 passos na ordem e me avise o resultado!**

