# 🚨 INSTRUÇÕES FINAIS - DELETAR FÉQUEIJÃO COMPLETAMENTE

## ✅ O QUE JÁ FOI FEITO NO CÓDIGO:
1. ✅ Arquivo `fequeijaologo.png` deletado
2. ✅ Referências removidas do Header.tsx
3. ✅ Referências removidas do Identification.tsx
4. ✅ Logo só aparece se houver logo customizado configurado

## 📋 O QUE VOCÊ PRECISA FAZER AGORA:

### 1️⃣ DELETAR A LOJA DO BANCO DE DADOS

Execute no Supabase SQL Editor (um comando por vez para não travar):

```sql
-- Primeiro, veja todas as lojas
SELECT id, name, slug FROM stores;
```

Depois execute ESTES comandos (um por vez):

```sql
-- 1. Deletar produtos
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 2. Deletar subsets
DELETE FROM subsets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 3. Deletar sets
DELETE FROM sets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 4. Deletar customizações
DELETE FROM store_customizations WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 5. Deletar admin_users
DELETE FROM admin_users WHERE store_id IN (SELECT id FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%');

-- 6. Deletar a loja
DELETE FROM stores WHERE LOWER(COALESCE(slug, '')) LIKE '%fequeij%' OR LOWER(COALESCE(name, '')) LIKE '%fequeij%';
```

### 2️⃣ LIMPAR CACHE DO NAVEGADOR

No Console do navegador (F12):

```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

### 3️⃣ DELETAR IMAGENS DO STORAGE

1. Supabase Dashboard > Storage > store-assets
2. Procure pastas relacionadas à loja FÉQUEIJÃO
3. Delete todas as imagens

### 4️⃣ REINICIAR SERVIDOR

```bash
# Pare o servidor (Ctrl+C)
# Depois:
npm run dev
```

## 🔍 VERIFICAÇÕES:

Após fazer tudo acima:

1. ✅ Acesse sua loja: `http://localhost:5176/{seu-slug}`
2. ✅ Verifique se não aparece logo do fequeijão
3. ✅ Verifique se as cores dos botões são da SUA loja
4. ✅ Verifique se não aparecem produtos do fequeijão

## ⚠️ SOBRE O LOGO:

- O logo do Header só aparece se você tiver configurado um logo customizado na sua loja
- Para adicionar logo: Admin > Personalização > Logo da Loja
- Se não houver logo configurado, o espaço ficará vazio (comportamento correto)

## ⚠️ SOBRE AS CORES DOS BOTÕES:

- As cores vêm do banco de dados (tabela `store_customizations`)
- Se ainda aparecerem cores erradas, é porque a loja FÉQUEIJÃO ainda está no banco
- Execute os comandos SQL novamente

