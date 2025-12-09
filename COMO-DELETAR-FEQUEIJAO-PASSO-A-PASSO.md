# 📖 COMO DELETAR A LOJA FÉQUEIJÃO - GUIA COMPLETO

## 🔍 PASSO A PASSO DETALHADO

### PARTE 1: Abrir o Supabase SQL Editor

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto**
   - Clique no projeto que você está usando

3. **Abra o SQL Editor**
   - No menu lateral esquerdo, procure por **"SQL Editor"**
   - Clique nele
   - Você verá uma tela com uma área de texto grande onde pode escrever código SQL

---

### PARTE 2: Ver quais lojas existem

1. **Primeiro, vamos ver todas as lojas**
   - Na área de texto do SQL Editor, cole este comando:

```sql
SELECT id, name, slug FROM stores;
```

2. **Execute o comando**
   - Clique no botão **"Run"** ou **"RUN"** ou pressione **F5**
   - Você verá uma tabela com todas as lojas cadastradas
   - **ANOTE** o ID da loja FÉQUEIJÃO (será algo como: `9b6d9152-cc4c-43f1-80c5-d97751b4b9a6`)

---

### PARTE 3: Deletar a loja FÉQUEIJÃO

⚠️ **IMPORTANTE: Execute UM comando por vez!**

#### Comando 1: Deletar produtos
1. **Limpe a área de texto** (Delete tudo que estiver lá)
2. **Cole este comando**:

```sql
DELETE FROM products 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);
```

3. **Clique em "Run"** ou pressione **F5**
4. **Aguarde** aparecer uma mensagem de sucesso (algo como "Success. No rows returned" ou números de linhas deletadas)

#### Comando 2: Deletar subsets
1. **Limpe a área de texto novamente**
2. **Cole este comando**:

```sql
DELETE FROM subsets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);
```

3. **Clique em "Run"**
4. **Aguarde** a mensagem de sucesso

#### Comando 3: Deletar sets
1. **Limpe a área de texto**
2. **Cole este comando**:

```sql
DELETE FROM sets 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);
```

3. **Clique em "Run"**
4. **Aguarde** a mensagem de sucesso

#### Comando 4: Deletar customizações
1. **Limpe a área de texto**
2. **Cole este comando**:

```sql
DELETE FROM store_customizations 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);
```

3. **Clique em "Run"**
4. **Aguarde** a mensagem de sucesso

#### Comando 5: Deletar admin_users
1. **Limpe a área de texto**
2. **Cole este comando**:

```sql
DELETE FROM admin_users 
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE LOWER(name) LIKE '%fequeij%' 
       OR LOWER(slug) LIKE '%fequeij%'
);
```

3. **Clique em "Run"**
4. **Aguarde** a mensagem de sucesso

#### Comando 6: Deletar a loja (último passo!)
1. **Limpe a área de texto**
2. **Cole este comando**:

```sql
DELETE FROM stores 
WHERE LOWER(name) LIKE '%fequeij%' 
   OR LOWER(slug) LIKE '%fequeij%';
```

3. **Clique em "Run"**
4. **Aguarde** a mensagem de sucesso

---

### PARTE 4: Verificar se foi deletada

1. **Limpe a área de texto**
2. **Cole este comando**:

```sql
SELECT id, name, slug 
FROM stores 
WHERE LOWER(name) LIKE '%fequeij%' 
   OR LOWER(slug) LIKE '%fequeij%';
```

3. **Clique em "Run"**

**✅ SE NÃO APARECER NENHUMA LINHA:** A loja foi deletada com sucesso!
**❌ SE APARECER ALGUMA LINHA:** Execute os comandos de deleção novamente

---

## 🎯 RESUMO VISUAL:

```
1. Supabase Dashboard → SQL Editor
2. Execute: SELECT id, name, slug FROM stores;
3. Execute os 6 comandos DELETE (um por vez)
4. Execute a verificação final
5. Pronto! ✅
```

---

## ⚠️ DÚVIDAS COMUNS:

**P: Onde fica o botão "Run"?**
R: Geralmente está no canto superior direito do SQL Editor, ou você pode pressionar F5

**P: E se der erro?**
R: Copie a mensagem de erro e me envie. Pode ser problema de permissões ou nome da tabela diferente

**P: Preciso fazer login?**
R: Sim, precisa estar logado no Supabase Dashboard

**P: Posso executar todos os comandos juntos?**
R: Não recomendado. Execute um por vez para evitar travamentos

---

## 🆘 SE AINDA TIVER DÚVIDAS:

Me envie:
1. Uma foto da tela do SQL Editor
2. Ou me diga em qual passo você está travado
3. Ou me envie a mensagem de erro que apareceu

