# 🔥 RESOLVER ERRO 42501 - GUIA DEFINITIVO

## ❌ O Problema
Erro `42501: new row violates row-level security policy for table "stores"` mesmo com políticas criadas.

---

## 🔍 DIAGNÓSTICO PASSO A PASSO

### PASSO 1: Verificar Políticas (Já feito ✅)
As políticas INSERT foram criadas corretamente. Isso foi confirmado.

### PASSO 2: Verificar se o problema é de autenticação

1. Abra o **Console do Navegador** (F12)
2. Tente fazer o cadastro novamente
3. Procure por estas mensagens no console:
   - `🔍 Verificação antes de inserir:`
   - `- Sessão existe:`
   - `- Token existe:`
   - `- User ID:`

**O que verificar:**
- Se `Sessão existe: Não` → O problema é de autenticação
- Se `Token existe: Não` → O token não está sendo enviado
- Se `User ID: N/A` → O usuário não está autenticado

---

## ✅ SOLUÇÕES

### SOLUÇÃO 1: Recriar Políticas (Mais Permissiva)

1. No **Supabase SQL Editor**, delete tudo
2. Abra o arquivo **`RECRIAR-POLITICAS-STORES.sql`**
3. Copie todo o conteúdo e cole no SQL Editor
4. Clique em **RUN**
5. Verifique se apareceu a política `stores_insert_authenticated`

### SOLUÇÃO 2: Limpar Cache COMPLETAMENTE

1. Pressione **Ctrl + Shift + Del**
2. Selecione:
   - ✅ **Cache**
   - ✅ **Cookies**
   - ✅ **Dados de sites**
3. Selecione **"Todo o período"**
4. Clique em **Limpar dados**
5. **Feche TODAS as abas do navegador**
6. **Feche o navegador completamente**
7. Abra o navegador novamente
8. Acesse: `http://localhost:5173/admin/register`

### SOLUÇÃO 3: Testar em Modo Anônimo

1. Pressione **Ctrl + Shift + N** (Chrome) ou **Ctrl + Shift + P** (Firefox)
2. Acesse: `http://localhost:5173/admin/register`
3. Tente fazer o cadastro

### SOLUÇÃO 4: Verificar Configuração Auth no Supabase

1. Vá em **Supabase Dashboard** → **Authentication** → **Settings**
2. Verifique se **"Email Confirmation"** está **DESABILITADO**
3. Se estiver habilitado, **DESABILITE** e salve
4. Verifique se **"Enable email confirmations"** está **OFF**

---

## 🔧 SOLUÇÃO ALTERNATIVA: Usar Função SQL

Se nada funcionar, podemos usar uma função SQL que contorna o RLS:

1. Execute o arquivo **`CRIAR-FUNCAO-INSERIR-LOJA.sql`** no Supabase
2. Isso criará uma função que bypassa o RLS temporariamente

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Antes de tentar novamente, verifique:

- [ ] Políticas INSERT existem (3 políticas)
- [ ] RLS está habilitado (true nas 3 tabelas)
- [ ] Cache do navegador foi limpo
- [ ] Navegador foi fechado e reaberto
- [ ] Email confirmation está DESABILITADO no Supabase
- [ ] Console do navegador mostra "Sessão existe: Sim"
- [ ] Console do navegador mostra "Token existe: Sim"

---

## 🎯 PRÓXIMOS PASSOS

1. **Execute `RECRIAR-POLITICAS-STORES.sql`** (SOLUÇÃO 1)
2. **Limpe o cache completamente** (SOLUÇÃO 2)
3. **Teste em modo anônimo** (SOLUÇÃO 3)
4. **Verifique o console do navegador** e me diga o que aparece

---

**Execute as soluções na ordem e me diga o resultado!**

