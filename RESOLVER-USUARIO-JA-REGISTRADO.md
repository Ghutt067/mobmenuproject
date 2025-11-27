# 🔧 Resolver Erro "User already registered"

## ❌ Erro Atual
```
User already registered
```

## 🎯 Causa do Problema

Mesmo tendo excluído o usuário visualmente no Supabase Dashboard, ele ainda pode existir em:
1. **auth.users** - Tabela de autenticação (pode estar "soft deleted")
2. **admin_users** - Tabela de administradores
3. **stores** - Loja associada ao usuário
4. Estado pendente de confirmação de email

## ✅ Solução Passo a Passo

### Passo 1: Limpar Usuário Completamente

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse **Supabase Dashboard**
2. Vá em **Authentication** → **Users**
3. **Busque pelo email** do usuário
4. Se encontrar:
   - Clique no usuário
   - Clique em **"Delete user"** ou **"Remove user"**
   - Confirme a exclusão
5. Aguarde **2-3 minutos** para o sistema processar

#### Opção B: Via SQL (Mais Completo)

1. Abra o arquivo **`limpar-usuario-completo.sql`**
2. **Substitua** `'EMAIL_DO_USUARIO@exemplo.com'` pelo email real
3. Execute no **Supabase SQL Editor**
4. Se der erro ao deletar de `auth.users`, delete manualmente pelo Dashboard

### Passo 2: Verificar Limpeza Completa

Execute este SQL para verificar se o usuário foi completamente removido:

```sql
-- Verificar em auth.users
SELECT id, email, created_at, deleted_at
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com';

-- Verificar em admin_users
SELECT id, email, store_id
FROM admin_users
WHERE email = 'SEU_EMAIL@exemplo.com';

-- Verificar lojas órfãs
SELECT s.id, s.name, s.owner_email
FROM stores s
LEFT JOIN admin_users au ON s.id = au.store_id
WHERE au.id IS NULL;
```

**Resultado esperado:** Nenhuma linha retornada (usuário não encontrado)

### Passo 3: Limpar Cache do Navegador

1. Abra o **Console do Navegador** (F12)
2. Vá em **Application** → **Storage**
3. Clique em **"Clear site data"**
4. Ou use **Ctrl+Shift+Delete** e limpe cache/cookies

### Passo 4: Testar Cadastro Novamente

1. Acesse `http://localhost:5173/admin/register`
2. Use um **email diferente** para testar
3. Ou aguarde **5 minutos** e tente com o mesmo email

## 🔍 Se o Problema Persistir

### Verificar Estado do Usuário no Auth

```sql
-- Ver todos os usuários (incluindo soft-deleted)
SELECT 
    id,
    email,
    created_at,
    deleted_at,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com';
```

Se `deleted_at` for NULL mas o usuário não aparece no Dashboard, ele pode estar em estado "pending".

### Forçar Exclusão Completa

Execute este SQL (substitua o email):

```sql
-- 1. Deletar de todas as tabelas relacionadas
DO $$
DECLARE
    user_id UUID;
    store_id UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'SEU_EMAIL@exemplo.com';
    
    IF user_id IS NOT NULL THEN
        -- Buscar store_id
        SELECT store_id INTO store_id
        FROM admin_users
        WHERE id = user_id;
        
        -- Deletar tudo relacionado
        IF store_id IS NOT NULL THEN
            DELETE FROM store_customizations WHERE store_id = store_id;
            DELETE FROM products WHERE store_id = store_id;
            DELETE FROM sets WHERE store_id = store_id;
            DELETE FROM subsets WHERE store_id = store_id;
            DELETE FROM stores WHERE id = store_id;
        END IF;
        
        DELETE FROM admin_users WHERE id = user_id;
        
        -- Tentar deletar de auth.users
        DELETE FROM auth.users WHERE id = user_id;
    END IF;
END $$;
```

### Usar Email Diferente Temporariamente

Se nada funcionar, use um email diferente para testar:
- `teste1@gmail.com`
- `teste2@gmail.com`
- `seuemail+1@gmail.com` (Gmail ignora o `+1`)

## 🛠️ Melhorias no Código

O código de cadastro foi atualizado para:
- ✅ Verificar se o email já existe antes de tentar criar
- ✅ Mostrar mensagem de erro mais clara
- ✅ Sugerir usar outro email ou aguardar

## 📋 Checklist de Verificação

- [ ] Usuário deletado do Supabase Dashboard (Authentication > Users)
- [ ] SQL de limpeza executado (se necessário)
- [ ] Verificação SQL mostra que usuário não existe
- [ ] Cache do navegador limpo
- [ ] Aguardou 2-3 minutos após exclusão
- [ ] Testou com email diferente
- [ ] Testou novamente com mesmo email após espera

## 💡 Dicas Importantes

1. **Aguarde alguns minutos** após deletar - o Supabase pode levar tempo para processar
2. **Use emails diferentes** para testes - evita conflitos
3. **Verifique o estado** do usuário antes de tentar criar novamente
4. **Limpe o cache** do navegador se o problema persistir

## 🆘 Se Nada Funcionar

1. Verifique os **logs do Supabase**:
   - **Logs** → **Auth Logs**
   - Procure por tentativas de signUp com o email
   
2. Verifique se há **limites de API** sendo excedidos

3. Entre em contato com o suporte do Supabase se o problema persistir

4. Como último recurso, use um **email completamente diferente** para continuar os testes

## 📝 Nota Técnica

O erro "User already registered" vem do Supabase Auth, que mantém um registro mesmo após exclusão visual. Isso é uma medida de segurança para evitar reutilização imediata de emails. O sistema geralmente limpa esses registros após alguns minutos, mas pode levar até 24 horas em alguns casos.

