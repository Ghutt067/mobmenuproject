# 🚨 SOLUÇÃO COMPLETA PARA REMOVER FÉQUEIJÃO

## Problemas identificados:
1. ❌ Script SQL travou
2. ❌ Logo do fequeijão aparece como fallback
3. ❌ Cores dos botões vêm da loja FÉQUEIJÃO
4. ❌ Cache do navegador mantém dados antigos

## ✅ SOLUÇÃO PASSO A PASSO:

### PASSO 1: Deletar a Loja do Banco de Dados

Execute este SQL no Supabase (um comando por vez):

```sql
-- 1. Ver todas as lojas
SELECT id, name, slug FROM stores;

-- 2. Deletar produtos da FÉQUEIJÃO
DELETE FROM products 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' 
       OR LOWER(COALESCE(name, '')) LIKE '%fequeij%'
);

-- 3. Deletar sets e subsets
DELETE FROM subsets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');
DELETE FROM sets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 4. Deletar customizações
DELETE FROM store_customizations WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 5. Deletar admin_users
DELETE FROM admin_users WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 6. Deletar a loja
DELETE FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%';

-- 7. Verificar se foi deletada
SELECT id, name, slug FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%';
```

### PASSO 2: Limpar Storage do Supabase (Imagens)

1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Abra o bucket **store-assets**
4. Procure por pastas com o ID da loja FÉQUEIJÃO
5. Delete TODAS as imagens relacionadas

### PASSO 3: Limpar Cache do Navegador COMPLETAMENTE

Execute no Console do navegador (F12):

```javascript
// Limpar TUDO
sessionStorage.clear();
localStorage.clear();
// Forçar reload sem cache
location.reload(true);
```

Ou manualmente:
1. Pressione `Ctrl + Shift + Delete`
2. Marque **Tudo**
3. Período: **Todo o período**
4. Clique em **Limpar dados**

### PASSO 4: Verificar Código

✅ O arquivo `fequeijaologo.png` já foi deletado
✅ As referências no código já foram removidas
✅ O Header agora só mostra logo se houver logo customizado

### PASSO 5: Reiniciar Servidor

1. Pare o servidor (Ctrl+C)
2. Execute novamente: `npm run dev`
3. Acesse a URL da sua loja

### PASSO 6: Testar

1. Acesse `http://localhost:5176/{slug-da-sua-loja}`
2. Verifique se:
   - ✅ Não aparece logo do fequeijão
   - ✅ Cores dos botões são da SUA loja
   - ✅ Não aparece conteúdo do fequeijão

## 🔍 Se ainda aparecer problemas:

### Problema: Cores dos botões ainda erradas
**Solução**: Limpe o cache novamente e verifique se a loja FÉQUEIJÃO foi realmente deletada do banco

### Problema: Logo ainda aparece
**Solução**: Verifique se você configurou um logo customizado na sua loja (Admin > Personalização)

### Problema: Página ainda mostra produtos do fequeijão
**Solução**: Execute os comandos SQL novamente e verifique se a loja foi deletada

