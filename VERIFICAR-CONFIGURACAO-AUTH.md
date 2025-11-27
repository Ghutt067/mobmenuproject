# 🔧 Verificar Configuração do Supabase Auth

## ❌ Erro Atual
```
Usuário não autenticado. Verifique as configurações do Supabase Auth.
```

## 🎯 Causa do Problema

O usuário não está sendo autenticado automaticamente após o signUp. Isso geralmente acontece quando:

1. **Confirmação de email está HABILITADA** (mais comum)
2. Configurações de autenticação incorretas
3. Problemas de rede/conexão

## ✅ Solução Passo a Passo

### **PASSO 1: Desabilitar Confirmação de Email** 🔴 CRÍTICO

1. Acesse seu **Supabase Dashboard**
2. Vá em **Authentication** → **Settings** (ou **Configuration**)
3. Procure por **"Email Confirmation"** ou **"Confirm email"**
4. **DESABILITE** esta opção (deve estar **OFF**/Desabilitado)
5. **Salve** as configurações

**IMPORTANTE:** Esta é a causa mais comum do erro!

---

### **PASSO 2: Verificar Outras Configurações**

No mesmo local (**Authentication** → **Settings**), verifique:

1. **"Enable Email Signup"** → Deve estar **HABILITADO** ✅
2. **"Enable Email Confirmations"** → Deve estar **DESABILITADO** ❌
3. **"Enable Email Change Confirmations"** → Pode estar habilitado ou desabilitado (não afeta cadastro)

---

### **PASSO 3: Verificar Site URL**

1. Vá em **Authentication** → **URL Configuration**
2. Verifique se a **Site URL** está configurada:
   - Para desenvolvimento: `http://localhost:5173`
   - Para produção: sua URL de produção
3. **Redirect URLs** deve incluir:
   - `http://localhost:5173/**`
   - `http://localhost:5173/admin/**`

---

### **PASSO 4: Limpar Cache e Testar**

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+Delete`
   - Selecione "Cache" e "Cookies"
   - Clique em "Limpar dados"

2. **Ou use modo anônimo:**
   - Pressione `Ctrl+Shift+N` (Chrome) ou `Ctrl+Shift+P` (Firefox)
   - Acesse `http://localhost:5173/admin/register`

3. **Teste o cadastro novamente**

---

### **PASSO 5: Verificar Logs**

Se ainda der erro, verifique os logs:

1. **No Supabase Dashboard:**
   - Vá em **Logs** → **Auth Logs**
   - Procure por tentativas de signUp
   - Veja se há erros específicos

2. **No Console do Navegador (F12):**
   - Vá na aba **Console**
   - Tente fazer o cadastro
   - Veja as mensagens de log:
     - `Usuário criado: [ID]`
     - `Sessão inicial: Existe/Não existe`
     - `✅ Usuário autenticado: [ID]`

---

## 🔍 Troubleshooting

### Erro: "Email rate limit exceeded"

**Solução:** Aguarde alguns minutos e tente novamente. O Supabase limita tentativas de email.

---

### Erro: "Invalid email"

**Solução:** Verifique se o email está em formato válido (ex: `teste@gmail.com`)

---

### Erro: "Password should be at least 6 characters"

**Solução:** Use uma senha com pelo menos 6 caracteres.

---

### Sessão não é criada mesmo após desabilitar confirmação

**Soluções:**

1. **Aguarde 1-2 minutos** após desabilitar a confirmação
2. **Recarregue a página** do Supabase Dashboard
3. **Verifique novamente** se está realmente desabilitado
4. **Limpe o cache** do navegador
5. **Teste em modo anônimo**

---

### Verificar se a Confirmação Está Realmente Desabilitada

Execute este SQL no Supabase SQL Editor para verificar:

```sql
-- Verificar configurações de auth (se acessível)
SELECT * FROM auth.config;
```

Ou verifique manualmente no Dashboard:
- **Authentication** → **Settings**
- Procure por "Email Confirmation"
- Deve estar **OFF**/Desabilitado

---

## 📋 Checklist de Verificação

Antes de testar o cadastro, verifique:

- [ ] Confirmação de email **DESABILITADA** no Supabase
- [ ] Email signup **HABILITADO** no Supabase
- [ ] Site URL configurada corretamente
- [ ] Redirect URLs incluem `http://localhost:5173/**`
- [ ] Cache do navegador limpo
- [ ] Console do navegador aberto (F12) para ver logs
- [ ] Aguardou 1-2 minutos após mudar configurações

---

## 💡 Dicas Importantes

1. **Sempre desabilite confirmação de email** em desenvolvimento
2. **Aguarde alguns minutos** após mudar configurações
3. **Use o console do navegador** para debug
4. **Verifique os logs do Supabase** se o problema persistir

---

## 🆘 Se Nada Funcionar

1. **Crie um novo projeto Supabase** (para teste)
2. **Execute o script SQL** `SETUP-COMPLETO-SUPABASE.sql`
3. **Desabilite confirmação de email** imediatamente
4. **Teste o cadastro**

Ou verifique se há algum problema de rede/firewall bloqueando as requisições do Supabase.

---

## ✅ Sucesso!

Se tudo estiver configurado corretamente, você verá no console:

```
Usuário criado: [uuid]
Sessão inicial: Existe
✅ Usuário autenticado: [uuid]
✅ Criando loja para usuário: [uuid]
```

E o cadastro será concluído com sucesso! 🎉

