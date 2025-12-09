# 🎯 TUTORIAL VISUAL - DELETAR FÉQUEIJÃO

## 📍 ONDE ESTOU AGORA?
Você precisa deletar a loja FÉQUEIJÃO do banco de dados do Supabase.

---

## 🚀 COMEÇANDO:

### 1️⃣ ABRIR O SUPABASE

1. Abra seu navegador (Chrome, Firefox, Edge, etc.)
2. Digite na barra de endereço: `https://supabase.com/dashboard`
3. Faça login na sua conta
4. Clique no seu projeto (se tiver mais de um)

### 2️⃣ ABRIR O SQL EDITOR

No menu do lado esquerdo, você verá várias opções:

```
📊 Table Editor
🔍 SQL Editor  ← CLIQUE AQUI
📦 Storage
⚙️ Settings
...
```

Clique em **"SQL Editor"** ou **"Editor SQL"**

### 3️⃣ VER A TELA DO SQL EDITOR

Você verá uma tela assim:

```
┌─────────────────────────────────────┐
│  SQL Editor              [+ New]    │ ← Botão no topo
├─────────────────────────────────────┤
│                                     │
│  [Área grande de texto aqui]        │ ← Aqui você cola os comandos
│                                     │
│                                     │
└─────────────────────────────────────┘
     [Run] ou [RUN]  ← Botão para executar
```

### 4️⃣ EXECUTAR OS COMANDOS

**IMPORTANTE: Execute UM comando por vez!**

#### COMANDO 1: Ver lojas
1. Clique na área de texto
2. Cole este texto:
```
SELECT id, name, slug FROM stores;
```
3. Clique no botão **"Run"** (ou pressione F5)
4. Veja o resultado - você verá uma tabela com todas as lojas

---

#### COMANDO 2: Deletar produtos
1. **Apague** o comando anterior (selecione tudo e delete)
2. Cole este texto:
```
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
3. Clique em **"Run"**
4. Aguarde aparecer mensagem de sucesso ✅

---

#### COMANDO 3: Deletar subsets
1. **Apague** o comando anterior
2. Cole este texto:
```
DELETE FROM subsets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
3. Clique em **"Run"**
4. Aguarde sucesso ✅

---

#### COMANDO 4: Deletar sets
1. **Apague** o comando anterior
2. Cole este texto:
```
DELETE FROM sets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
3. Clique em **"Run"**
4. Aguarde sucesso ✅

---

#### COMANDO 5: Deletar customizações
1. **Apague** o comando anterior
2. Cole este texto:
```
DELETE FROM store_customizations WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
3. Clique em **"Run"**
4. Aguarde sucesso ✅

---

#### COMANDO 6: Deletar admin_users
1. **Apague** o comando anterior
2. Cole este texto:
```
DELETE FROM admin_users WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
3. Clique em **"Run"**
4. Aguarde sucesso ✅

---

#### COMANDO 7: Deletar a loja (último!)
1. **Apague** o comando anterior
2. Cole este texto:
```
DELETE FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';
```
3. Clique em **"Run"**
4. Aguarde sucesso ✅

---

#### COMANDO 8: Verificar
1. **Apague** o comando anterior
2. Cole este texto:
```
SELECT id, name, slug FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';
```
3. Clique em **"Run"**

**✅ SE NÃO APARECER NADA:** Sucesso! A loja foi deletada!
**❌ SE APARECER ALGUMA LINHA:** Repita os comandos de deleção

---

## 📸 ONDE ESTÁ O BOTÃO "RUN"?

O botão geralmente está assim:

```
┌──────────────────────────────────┐
│ SQL Editor        [+ New] [Run] │ ← Aqui
└──────────────────────────────────┘
```

Ou pode estar assim:
- No canto superior direito
- Um botão verde com texto "Run" ou "RUN" ou "▶ Run"
- Ou pressione **F5** no teclado

---

## 🆘 PRECISA DE AJUDA?

Me diga:
- Qual passo você está?
- O que aparece na sua tela?
- Qual erro aparece (se houver)?

