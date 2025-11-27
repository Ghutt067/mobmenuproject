# 🔍 Guia de Diagnóstico - Problema ao Criar Produtos

## 📊 Situação Atual

- ✅ Tabela `products` existe
- ❌ Nenhum produto foi criado (0 produtos)
- ⚠️ Tentativa de criar produto não está funcionando

## 🎯 Próximos Passos para Diagnóstico

### Passo 1: Executar Diagnóstico Completo

Execute o script **`DIAGNOSTICO-COMPLETO-PRODUTOS.sql`** no Supabase SQL Editor.

Este script vai verificar:
- ✅ Se a tabela existe
- ✅ Se RLS está habilitado
- ✅ Se há política de INSERT
- ✅ Se a política de INSERT está configurada corretamente
- ✅ Se o usuário tem loja associada
- ✅ Estrutura da tabela

**Copie TODOS os resultados** e verifique especialmente:
- Se "Política INSERT existe" mostra ✅ ou ❌
- Se "RLS habilitado" mostra ✅ ou ❌

### Passo 2: Testar Inserção Direta via SQL

Execute o script **`TESTAR-INSERIR-PRODUTO.sql`** no Supabase SQL Editor.

**IMPORTANTE:** Execute este script **ENQUANTO ESTIVER LOGADO** na aplicação (em outra aba do navegador).

Este script vai:
1. Verificar se você está autenticado
2. Buscar sua loja associada
3. Tentar inserir um produto de teste diretamente
4. Mostrar se funcionou ou qual foi o erro

**Resultados possíveis:**

✅ **Se funcionar:**
- A política RLS está OK
- O problema está no código JavaScript
- Verifique os logs do console ao tentar criar produto

❌ **Se não funcionar:**
- Aparecerá uma mensagem de erro específica
- Pode ser problema de RLS ou permissões
- Execute `CRIAR-TODAS-TABELAS-PRODUTOS.sql` novamente

### Passo 3: Verificar Logs no Console

1. **Abra o Console do Navegador** (F12)
2. **Tente criar um produto** na aplicação
3. **Observe TODOS os logs** que aparecem

Você deve ver logs como:
```
🔍 [createProduct] Criando produto...
✅ [createProduct] Sessão ativa confirmada
📤 [createProduct] Dados para inserção...
```

**Se aparecer erro:**
- Copie a mensagem de erro completa
- Verifique o código do erro (42501 = RLS, 42P01 = tabela não existe, etc.)

### Passo 4: Verificar Políticas RLS Manualmente

Execute este SQL para ver todas as políticas:

```sql
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY cmd;
```

**Deve ter 5 políticas:**
1. `Public can view active products` - SELECT (anon, authenticated)
2. `Admins can view their store products` - SELECT (authenticated)
3. `Admins can insert their store products` - INSERT (authenticated) ⚠️ **CRÍTICA**
4. `Admins can update their store products` - UPDATE (authenticated)
5. `Admins can delete their store products` - DELETE (authenticated)

**Se a política de INSERT não existir ou estiver incorreta:**
- Execute `CRIAR-TODAS-TABELAS-PRODUTOS.sql` novamente

## 🔧 Soluções Comuns

### Problema: Política INSERT não existe

**Solução:**
```sql
-- Criar política de INSERT
CREATE POLICY "Admins can insert their store products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  store_id IN (
    SELECT store_id FROM admin_users 
    WHERE id = auth.uid()
  )
);
```

### Problema: RLS não está habilitado

**Solução:**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Problema: Usuário não tem loja associada

**Solução:**
Verifique se o usuário existe em `admin_users`:
```sql
SELECT * FROM admin_users WHERE id = auth.uid();
```

Se não existir, insira:
```sql
-- Substitua os valores pelos seus dados
INSERT INTO admin_users (id, email, store_id, role)
VALUES (
    auth.uid(),
    'seu-email@exemplo.com',
    'ID_DA_SUA_LOJA',
    'admin'
);
```

## 📝 Checklist de Verificação

- [ ] Tabela `products` existe
- [ ] RLS está habilitado na tabela `products`
- [ ] Política de INSERT existe
- [ ] Política de INSERT usa `WITH CHECK` corretamente
- [ ] Usuário está autenticado (auth.uid() retorna um ID)
- [ ] Usuário tem loja associada em `admin_users`
- [ ] Loja existe em `stores`
- [ ] Teste de inserção via SQL funciona
- [ ] Logs no console mostram erro específico

## 🆘 Ainda Não Funciona?

Se após seguir todos os passos o problema persistir:

1. **Execute `DIAGNOSTICO-COMPLETO-PRODUTOS.sql`** e copie TODOS os resultados
2. **Execute `TESTAR-INSERIR-PRODUTO.sql`** e copie o resultado (erro ou sucesso)
3. **Copie TODOS os logs do console** ao tentar criar produto
4. **Verifique se você está logado** corretamente na aplicação

Com essas informações, será possível identificar exatamente onde está o problema!



