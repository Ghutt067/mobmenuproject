# 📋 Guia Completo de Migração do Supabase

## 🎯 Objetivo
Migrar todo o banco de dados e configurações de uma conta Supabase para outra.

## 📝 Passo a Passo

### **PASSO 1: Preparar Nova Conta Supabase**

1. Acesse a **nova conta do Supabase**
2. Crie um **novo projeto** (se ainda não tiver)
3. Anote as **credenciais**:
   - URL do projeto (ex: `https://xxxxx.supabase.co`)
   - Chave anônima (anon key)

### **PASSO 2: Executar Script SQL**

1. Acesse **SQL Editor** no Supabase Dashboard
2. **Delete todos os queries** existentes
3. Abra o arquivo **`MIGRACAO-COMPLETA-SUPABASE.sql`**
4. **Copie TODO o conteúdo**
5. **Cole** no SQL Editor
6. Clique em **Run** (ou pressione F5)
7. **Aguarde** a execução terminar
8. Verifique se **não há erros** (deve aparecer "Success")

### **PASSO 3: Atualizar Credenciais no Código**

1. Abra o arquivo: `src/lib/supabase.ts`
2. Atualize as credenciais:

```typescript
const supabaseUrl = 'https://SUA-NOVA-URL.supabase.co'; // ← NOVA URL
const supabaseAnonKey = 'SUA-NOVA-CHAVE-ANONIMA'; // ← NOVA CHAVE

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Onde encontrar as credenciais:**
- Supabase Dashboard → **Settings** → **API**
- **Project URL** = `supabaseUrl`
- **anon public** key = `supabaseAnonKey`

### **PASSO 4: Configurar Supabase Auth**

1. Acesse **Authentication** → **Settings** no Supabase Dashboard
2. Configure:
   - ✅ **Enable Email Signup**: **HABILITADO**
   - ❌ **Enable Email Confirmations**: **DESABILITADO** (IMPORTANTE!)
   - ✅ **Enable Email Change Confirmations**: Pode estar habilitado ou não

**Por quê desabilitar confirmação de email?**
- Com confirmação habilitada, o usuário não fica autenticado imediatamente após cadastro
- Isso causa erro de RLS ao tentar criar loja
- O sistema precisa que o usuário esteja autenticado para criar loja

### **PASSO 5: Configurar Site URL (Opcional)**

1. Acesse **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:5173` (desenvolvimento)
   - **Redirect URLs**: Adicione:
     - `http://localhost:5173/**`
     - `http://localhost:5173/admin/**`

### **PASSO 6: Testar a Migração**

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Teste o cadastro**:
   - Acesse: `http://localhost:5173/admin/register`
   - Preencha o formulário
   - Clique em "Cadastrar"
   - Deve redirecionar para login com sucesso

3. **Teste o login**:
   - Faça login com as credenciais criadas
   - Deve acessar o painel admin

4. **Teste adicionar produto**:
   - Vá em **Produtos**
   - Adicione um produto
   - Verifique se aparece na loja

### **PASSO 7: Migrar Dados Antigos (Opcional)**

Se você tem dados na conta antiga que quer migrar:

#### Opção A: Exportar/Importar via Dashboard

1. **Na conta antiga**:
   - Vá em **Table Editor**
   - Selecione cada tabela
   - Exporte os dados (CSV ou JSON)

2. **Na conta nova**:
   - Vá em **Table Editor**
   - Importe os dados exportados

#### Opção B: Usar Script SQL

1. **Na conta antiga**:
   - Execute queries SELECT para exportar dados
   - Copie os resultados

2. **Na conta nova**:
   - Crie scripts INSERT com os dados
   - Execute no SQL Editor

## ✅ Checklist de Verificação

Após executar o script SQL, verifique:

- [ ] Tabelas criadas: `stores`, `admin_users`, `store_customizations`
- [ ] Funções criadas: `insert_store`, `insert_admin_user`, `insert_store_customizations`
- [ ] Políticas RLS configuradas para todas as tabelas
- [ ] Storage bucket `store-assets` criado
- [ ] Índices criados
- [ ] Trigger `has_discount` criado (se products existir)

## 🔍 Verificar se Tudo Está OK

Execute este SQL no Supabase para verificar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stores', 'admin_users', 'store_customizations')
ORDER BY table_name;

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('insert_store', 'insert_admin_user', 'insert_store_customizations')
ORDER BY routine_name;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('stores', 'admin_users', 'store_customizations')
ORDER BY tablename, cmd;
```

## 🐛 Problemas Comuns

### Erro: "new row violates row-level security policy"

**Solução:**
1. Verifique se as políticas RLS foram criadas corretamente
2. Execute novamente a parte 8 do script SQL (RLS)
3. Verifique se "Email Confirmation" está DESABILITADO

### Erro: "function does not exist"

**Solução:**
1. Execute novamente a parte 7 do script SQL (Funções)
2. Verifique se as permissões foram concedidas

### Erro: "relation does not exist"

**Solução:**
1. Execute novamente a parte 2 do script SQL (Tabelas)
2. Verifique se não há erros de sintaxe

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador (F12)
2. Verifique os logs no Supabase Dashboard → Logs
3. Execute os scripts de verificação SQL
4. Compare com a conta antiga (se ainda tiver acesso)

## 🎉 Pronto!

Após seguir todos os passos, sua migração está completa e o sistema deve funcionar normalmente na nova conta do Supabase!




