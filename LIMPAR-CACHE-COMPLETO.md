# 🧹 LIMPAR CACHE COMPLETO - Remover Cores do FÉQUEIJAO

## ⚠️ PROBLEMA
As cores do FÉQUEIJAO continuam aparecendo mesmo após deletar a loja do banco de dados.

## 🔍 CAUSAS POSSÍVEIS
1. **sessionStorage do navegador** ainda contém o slug da loja FÉQUEIJAO
2. **Cache do navegador** está servindo dados antigos
3. **Outra loja no banco** com cores similares está sendo carregada
4. **Customizações órfãs** na tabela `store_customizations`

## ✅ SOLUÇÃO COMPLETA - SIGA OS PASSOS

### PASSO 1: Limpar sessionStorage e localStorage do Navegador

1. **Abra o Console do Desenvolvedor**:
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Ou `Cmd+Option+I` (Mac)

2. **Vá para a aba "Console"**

3. **Execute estes comandos UM POR VEZ**:

```javascript
// Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo!');

// Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo!');

// Verificar se foi limpo
console.log('sessionStorage:', sessionStorage.length, 'itens');
console.log('localStorage:', localStorage.length, 'itens');
```

4. **Recarregue a página** (`Ctrl+R` ou `F5`)

### PASSO 2: Verificar no Banco de Dados (Supabase)

Execute estes comandos SQL no SQL Editor do Supabase:

#### 2.1 - Ver TODAS as lojas cadastradas:
```sql
SELECT id, name, slug, created_at 
FROM stores 
ORDER BY created_at DESC;
```

#### 2.2 - Ver TODAS as customizações:
```sql
SELECT 
    sc.id as customization_id,
    sc.store_id,
    s.name as store_name,
    s.slug as store_slug,
    sc.primary_color,
    sc.secondary_color,
    sc.background_color,
    sc.text_color
FROM store_customizations sc
JOIN stores s ON s.id = sc.store_id
ORDER BY sc.created_at DESC;
```

#### 2.3 - Verificar se há alguma referência ao FÉQUEIJAO:
```sql
SELECT 
    id, 
    name, 
    slug
FROM stores 
WHERE LOWER(name) LIKE '%fequeij%' 
   OR LOWER(slug) LIKE '%fequeij%'
   OR LOWER(name) LIKE '%féqueij%'
   OR LOWER(slug) LIKE '%féqueij%';
```

Se retornar **VAZIO**, a loja foi deletada corretamente. ✅

#### 2.4 - Limpar customizações órfãs (caso existam):
```sql
DELETE FROM store_customizations 
WHERE store_id NOT IN (SELECT id FROM stores);
```

### PASSO 3: Limpar Cache do Navegador

1. **Pressione `Ctrl+Shift+Delete`** (Windows/Linux) ou `Cmd+Shift+Delete` (Mac)

2. **Selecione**:
   - ✅ Imagens e arquivos em cache
   - ✅ Cookies e outros dados de sites
   - ⏰ Última hora (ou o período que desejar)

3. **Clique em "Limpar dados"**

### PASSO 4: Reiniciar o Servidor de Desenvolvimento

1. **Pare o servidor** (pressione `Ctrl+C` no terminal)

2. **Inicie novamente**:
```bash
npm run dev
```

### PASSO 5: Testar

1. **Acesse**: `http://localhost:5176/`

2. **Verifique**:
   - ✅ Deve redirecionar para `/admin/login`
   - ✅ Não deve aparecer logo do FÉQUEIJAO
   - ✅ Cores devem ser os valores padrão (laranja #FF6B35, azul #004E89)

## 🔧 SE AINDA APARECER AS CORES DO FÉQUEIJAO

### Verificar qual loja está sendo carregada:

1. **Abra o Console do Desenvolvedor** (`F12`)

2. **Procure por mensagens** como:
   - `✅ [StoreContext] Loja carregada:`
   - `🔍 [StoreContext] Carregando loja por slug:`

3. **Anote qual loja está sendo carregada**

4. **Se for uma loja diferente do FÉQUEIJAO**, ela pode ter as mesmas cores configuradas. Nesse caso:
   - Acesse o admin dessa loja
   - Vá em "Personalização"
   - Altere as cores para cores diferentes

## 📝 RESUMO DOS COMANDOS SQL

Use o arquivo `VERIFICAR-E-LIMPAR-TUDO.sql` que contém todos os comandos em sequência.

## ⚠️ IMPORTANTE

- **O código do projeto não será afetado** ao deletar a loja do banco
- **Apenas os dados no Supabase** serão removidos
- **Se você criar uma nova loja**, ela terá cores padrão até você personalizá-las

