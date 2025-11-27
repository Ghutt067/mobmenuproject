# 🚨 EXECUTE ESTE SCRIPT AGORA!

## ❌ Você está recebendo erro de RLS?

## ✅ SOLUÇÃO RÁPIDA (2 MINUTOS)

### **PASSO 1: Execute o Script**

1. Abra o arquivo **`EXECUTAR-ESTE-SCRIPT.sql`** (o mais simples)
   - OU **`FORCAR-CORRECAO-RLS.sql`** (mais completo)

2. **Copie TODO o conteúdo**

3. Vá em **Supabase Dashboard** → **SQL Editor**

4. **Cole** o código

5. Clique em **"Run"** (ou Ctrl+Enter)

6. **Aguarde** aparecer "Success"

---

### **PASSO 2: Verificar**

Execute esta query no SQL Editor:

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('stores', 'admin_users', 'store_customizations') 
  AND cmd = 'INSERT';
```

**Você DEVE ver 3 políticas:**
- ✅ `Allow authenticated to create stores`
- ✅ `Allow authenticated to create admin user`  
- ✅ `Allow authenticated to create customizations`

**Se NÃO aparecer as 3, execute o script novamente!**

---

### **PASSO 3: Testar**

1. **Limpe o cache** (Ctrl+Shift+Delete)
2. **Abra o Console** (F12)
3. Acesse `http://localhost:5173/admin/register`
4. **Faça um cadastro**
5. Veja os logs no console

---

## 🔍 O que você verá no Console

**Se funcionar:**
```
✅ Usuário autenticado: [uuid]
✅ Sessão ativa: Sim
✅ Token de acesso: Existe
✅ Verificação de autenticação OK: [uuid]
✅ Criando loja para usuário: [uuid]
```

**Se der erro:**
```
❌ Erro ao criar loja: [detalhes]
Código do erro: 42501
```

---

## 🆘 Se Ainda Der Erro

### Verifique se está autenticado:

No console, você deve ver:
- ✅ `Usuário autenticado` → Se NÃO aparecer, o problema é de autenticação
- ✅ `Sessão ativa: Sim` → Se aparecer "Não", execute o script novamente

### Execute o Script Completo:

Se o script simples não funcionar, execute:
- **`FORCAR-CORRECAO-RLS.sql`** (mais completo)

---

## ✅ Pronto!

Após executar o script e verificar as 3 políticas, o cadastro deve funcionar! 🎉

