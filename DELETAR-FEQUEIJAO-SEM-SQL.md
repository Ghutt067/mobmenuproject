# 🎯 DELETAR FÉQUEIJAO SEM USAR SQL (Interface Visual)

Como você está com erro de conexão no SQL Editor, vamos usar a **interface visual** do Supabase!

---

## 🚀 MÉTODO ALTERNATIVO: Table Editor (Mais Fácil!)

### PASSO 1: Abrir o Table Editor

1. No Supabase Dashboard, no menu lateral esquerdo
2. Clique em **"Table Editor"** (não SQL Editor!)
3. Você verá uma lista de tabelas

---

### PASSO 2: Encontrar a loja FÉQUEIJAO

1. Na lista de tabelas, procure por **"stores"**
2. Clique na tabela **"stores"**
3. Você verá uma tabela com todas as lojas
4. Procure pela linha que tem o nome **"FÉQUEIJAO"** ou algo parecido
5. **ANOTE** o ID dessa loja (primeira coluna)

---

### PASSO 3: Deletar os dados relacionados

Agora vamos deletar os dados relacionados, uma tabela por vez:

#### 3.1: Deletar produtos
1. Clique na tabela **"products"** no menu lateral
2. Procure por produtos que tenham o **store_id** igual ao ID da loja FÉQUEIJAO
3. Clique nos **3 pontinhos (⋯)** ao lado de cada produto
4. Selecione **"Delete row"**
5. Repita para todos os produtos da FÉQUEIJAO

#### 3.2: Deletar customizações
1. Clique na tabela **"store_customizations"**
2. Procure pela linha que tem o **store_id** da FÉQUEIJAO
3. Clique nos **3 pontinhos (⋯)**
4. Selecione **"Delete row"**

#### 3.3: Deletar sets e subsets
1. Clique na tabela **"sets"**
2. Delete todas as linhas com o **store_id** da FÉQUEIJAO
3. Clique na tabela **"subsets"**
4. Delete todas as linhas com o **store_id** da FÉQUEIJAO

#### 3.4: Deletar admin_users
1. Clique na tabela **"admin_users"**
2. Delete a linha que tem o **store_id** da FÉQUEIJAO

#### 3.5: Deletar a loja (último passo!)
1. Volte para a tabela **"stores"**
2. Encontre a linha da FÉQUEIJAO
3. Clique nos **3 pontinhos (⋯)**
4. Selecione **"Delete row"**
5. Confirme a deleção

---

## ✅ PRONTO!

A loja FÉQUEIJAO foi deletada completamente!

---

## 🆘 SE NÃO CONSEGUIR VER AS TABELAS:

Pode ser problema de permissões. Me avise e vamos tentar outra forma!

