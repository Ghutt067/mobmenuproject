# 📋 Ordem de Execução dos Scripts SQL

## ✅ SOLUÇÃO SIMPLES: Execute APENAS 1 arquivo!

### 🎯 **Arquivo Único: `SETUP-COMPLETO-SUPABASE.sql`**

Este arquivo contém **TUDO** na ordem correta. Você só precisa executar **ESTE ARQUIVO**.

---

## 📝 Passo a Passo:

### 1️⃣ **Limpar SQL Editor**
- Acesse **Supabase Dashboard** → **SQL Editor**
- **Delete TODOS os queries** que estão lá
- Deixe o editor vazio

### 2️⃣ **Executar o Script Único**
- Abra o arquivo **`SETUP-COMPLETO-SUPABASE.sql`** neste projeto
- **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
- **Cole** no SQL Editor do Supabase (Ctrl+V)
- Clique em **"Run"** ou pressione **Ctrl+Enter**
- **Aguarde** a execução terminar
- Verifique se **NÃO há erros** (deve aparecer "Success")

### 3️⃣ **Configurar Auth (OBRIGATÓRIO)**
- Vá em **Authentication** → **Settings**
- **DESABILITE** "Email Confirmation" ou "Confirm email"
- **Salve** as configurações

### 4️⃣ **Testar**
- Acesse `http://localhost:5173/admin/register`
- Faça um cadastro de teste
- Deve funcionar sem erros! ✅

---

## 🔄 Se Precisar Executar em Partes (NÃO RECOMENDADO)

Se por algum motivo você precisar executar em partes separadas, use esta ordem:

### **Ordem 1: Estrutura do Banco**
- `supabase-schema.sql` (cria tabelas básicas)

### **Ordem 2: Políticas RLS**
- `SOLUCAO-RLS-DEFINITIVA.sql` (corrige políticas RLS)

**MAS:** É muito mais fácil executar apenas o `SETUP-COMPLETO-SUPABASE.sql` que já tem tudo!

---

## ❌ Arquivos que NÃO precisa executar:

Estes arquivos são apenas para referência ou casos específicos:

- ❌ `fix-rls-cadastro.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `corrigir-rls-definitivo.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `supabase-rls-policies.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `supabase-rls-policies-fix.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `supabase-rls-fix-completo.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `supabase-rls-solucao-final.sql` - Substituído pelo SETUP-COMPLETO
- ❌ `verificar-politicas-rls.sql` - Apenas para verificação
- ❌ `limpar-usuario-completo.sql` - Apenas para limpar usuários específicos
- ❌ `supabase-completo.sql` - Versão antiga, use SETUP-COMPLETO

---

## ✅ Resumo:

1. **Delete todos os queries do SQL Editor**
2. **Execute APENAS:** `SETUP-COMPLETO-SUPABASE.sql`
3. **Desabilite confirmação de email** no Supabase
4. **Teste o cadastro**

**Pronto! 🎉**

---

## 🆘 Se Der Erro:

1. Verifique se não há queries antigos no SQL Editor
2. Execute o script novamente (pode dar erro se já existir, mas é normal)
3. Verifique os logs no Supabase Dashboard → Logs
4. Certifique-se de que a confirmação de email está DESABILITADA

---

## 📊 Verificação (Opcional):

Após executar, você pode verificar se tudo está correto executando:

```sql
-- Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd, policyname;
```

Você deve ver pelo menos:
- ✅ `Allow authenticated to create stores` (INSERT)
- ✅ `Allow authenticated to create admin user` (INSERT)
- ✅ `Allow authenticated to create customizations` (INSERT)

