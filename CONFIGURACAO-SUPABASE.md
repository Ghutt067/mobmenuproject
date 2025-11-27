# 🔧 Configuração do Supabase

Este projeto está configurado para usar variáveis de ambiente para as credenciais do Supabase, garantindo maior segurança e flexibilidade.

## 📋 Passo a Passo

### 1. Criar arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Obter suas credenciais do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → use como `VITE_SUPABASE_URL`
   - **anon public** key → use como `VITE_SUPABASE_ANON_KEY`

### 3. Preencher o arquivo `.env`

Substitua os valores de exemplo pelas suas credenciais reais:

```env
VITE_SUPABASE_URL=https://qipdgnizrolzwxnotgqh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Reiniciar o servidor de desenvolvimento

Após criar/atualizar o arquivo `.env`, você precisa reiniciar o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente
npm run dev
```

## ⚠️ Importante

- O arquivo `.env` está no `.gitignore` e **não será commitado** no Git
- Nunca compartilhe suas chaves do Supabase publicamente
- Use o arquivo `.env.example` como referência para outros desenvolvedores

## 🔍 Verificação

Após configurar, o projeto deve funcionar normalmente. Se você ver um erro sobre variáveis de ambiente não configuradas, verifique:

1. O arquivo `.env` existe na raiz do projeto
2. As variáveis começam com `VITE_`
3. O servidor foi reiniciado após criar/editar o `.env`

## 📚 Recursos

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Variáveis de Ambiente no Vite](https://vitejs.dev/guide/env-and-mode.html)

