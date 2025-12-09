# 🎯 DELETAR FÉQUEIJÃO - SUPER FÁCIL

## Você já tem conta no Supabase?
- ✅ SIM → Vá direto para "PARTE A"
- ❌ NÃO → Você precisa do link de acesso primeiro

---

## PARTE A: ABRIR O SUPABASE

### Passo 1: Acessar o site
1. Abra o Google Chrome (ou outro navegador)
2. Digite na barra de endereço: `supabase.com`
3. Clique em **"Sign In"** ou **"Entrar"** (canto superior direito)
4. Faça login com email e senha

### Passo 2: Entrar no seu projeto
- Depois de logado, você verá seus projetos
- **Clique no projeto** que você está usando

### Passo 3: Abrir o SQL Editor
- No menu do lado esquerdo, procure por: **"SQL Editor"**
- Clique nele
- Você verá uma tela branca grande (é lá que vamos colar os comandos)

---

## PARTE B: EXECUTAR OS COMANDOS

⚠️ **IMPORTANTE:** Execute **UM comando por vez!**

### Como fazer:
1. **Copie** um comando abaixo (selecione o texto e Ctrl+C)
2. **Cole** na tela do SQL Editor (clique lá e Ctrl+V)
3. **Clique no botão "Run"** (geralmente verde, no canto superior direito)
4. **Aguarde** aparecer "Success" ou mensagem de sucesso
5. **Apague** o comando que executou
6. **Repita** com o próximo comando

---

## OS COMANDOS (copie e cole um por vez):

### Comando 1:
```
SELECT id, name, slug FROM stores;
```
👉 Execute e veja se aparece a loja FÉQUEIJÃO na lista

---

### Comando 2:
```
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
👉 Execute e aguarde sucesso

---

### Comando 3:
```
DELETE FROM subsets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
👉 Execute e aguarde sucesso

---

### Comando 4:
```
DELETE FROM sets WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
👉 Execute e aguarde sucesso

---

### Comando 5:
```
DELETE FROM store_customizations WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
👉 Execute e aguarde sucesso

---

### Comando 6:
```
DELETE FROM admin_users WHERE store_id IN (SELECT id FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%');
```
👉 Execute e aguarde sucesso

---

### Comando 7 (último!):
```
DELETE FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';
```
👉 Execute e aguarde sucesso

---

### Comando 8 (verificar):
```
SELECT id, name, slug FROM stores WHERE LOWER(name) LIKE '%fequeij%' OR LOWER(slug) LIKE '%fequeij%';
```
👉 Execute - **Se não aparecer nada, está tudo certo!** ✅

---

## 🆘 PRECISA DE AJUDA?

**Me diga:**
- "Não consigo fazer login no Supabase"
- "Não encontro o SQL Editor"
- "Não vejo o botão Run"
- "Deu erro quando executei o comando"
- Ou tire uma foto da tela e me mostre

Vou te ajudar no passo que você estiver! 😊

