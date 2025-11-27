# Como Desabilitar Confirmação de Email no Supabase

## Passo 1: Configuração no Supabase Dashboard

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** (no menu lateral)
4. Clique em **Providers**
5. Encontre a seção **Email** e clique nela
6. Desabilite a opção **"Confirm email"** ou **"Enable email confirmations"**
7. Salve as alterações

## Passo 2: Verificar Configurações Adicionais

Também verifique em **Authentication > Settings**:
- **Enable email confirmations**: Desabilite esta opção
- **Secure email change**: Pode deixar habilitado ou desabilitado (opcional)

Após fazer essas alterações, os usuários serão autenticados automaticamente após o cadastro, sem precisar confirmar o email.

