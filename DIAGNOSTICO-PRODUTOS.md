# 🔍 Diagnóstico de Carregamento de Produtos

## ✅ O que foi feito:

1. **Logs de debug adicionados** em:
   - `productService.ts` - Logs detalhados ao buscar produtos
   - `StoreContext.tsx` - Logs ao carregar loja
   - `Home.tsx` - Logs do fluxo de carregamento

2. **Script SQL de verificação criado**: `VERIFICAR-CONEXAO-PRODUTOS.sql`

## 🔍 Como diagnosticar:

### Passo 1: Verificar no Console do Navegador

1. Abra o site no navegador
2. Abra o Console (F12 → Console)
3. Procure por mensagens que começam com:
   - 🔍 (busca iniciada)
   - ✅ (sucesso)
   - ⚠️ (aviso)
   - ❌ (erro)

### Passo 2: Verificar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `VERIFICAR-CONEXAO-PRODUTOS.sql`
4. Verifique:
   - Se há produtos no banco
   - Se há lojas cadastradas
   - Se as políticas RLS estão corretas

### Passo 3: Verificar a URL

O sistema precisa de um **slug de loja** para carregar produtos. Verifique:

- **Com slug**: `http://localhost:5173/?store=slug-da-loja`
- **Sem slug**: `http://localhost:5173/` (não carregará produtos)

## 🐛 Problemas Comuns:

### 1. "Nenhum slug de loja encontrado"
**Solução**: Acesse com `?store=slug` na URL ou configure um subdomínio

### 2. "Erro ao buscar produtos" (código 42501)
**Solução**: Execute o script `EXECUTAR-ESTE-SCRIPT.sql` no Supabase para corrigir RLS

### 3. "Loja não encontrada"
**Solução**: Verifique se a loja existe no banco e se o slug está correto

### 4. "Produtos encontrados: 0"
**Solução**: 
- Verifique se há produtos no banco
- Verifique se os produtos estão ativos (`is_active = true`)
- Verifique se os produtos têm `store_id` correto

## 📋 Checklist de Verificação:

- [ ] Console mostra logs de debug
- [ ] Há produtos no banco de dados
- [ ] Há lojas cadastradas
- [ ] Políticas RLS estão configuradas
- [ ] URL contém `?store=slug` ou subdomínio
- [ ] Produtos têm `store_id` correto
- [ ] Produtos estão com `is_active = true`

## 🔧 Próximos Passos:

1. Abra o console do navegador e verifique os logs
2. Execute o script SQL de verificação
3. Compartilhe os logs do console para análise mais detalhada




