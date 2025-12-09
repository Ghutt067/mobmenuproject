# Instruções para Deletar a Loja FÉQUEIJÃO e Configurar Redirecionamento

## Passo 1: Deletar a Loja FÉQUEIJÃO do Banco de Dados

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `DELETAR-LOJA-FEQUEIJAO.sql`
4. Copie TODO o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Execute o script (botão "Run" ou F5)
7. Verifique se não há erros
8. O script mostrará mensagens de sucesso para cada item deletado

**⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL! Todos os dados da loja FÉQUEIJÃO serão deletados permanentemente.**

## Passo 2: Verificar se foi deletada

Após executar o script, execute esta query para verificar:

```sql
SELECT id, name, slug 
FROM stores 
WHERE LOWER(slug) LIKE '%fequeij%' 
   OR LOWER(name) LIKE '%fequeij%';
```

Se não retornar nenhuma linha, a loja foi deletada com sucesso!

## Passo 3: Limpar Cache do Navegador

Após deletar a loja, limpe o cache do navegador:

1. Pressione `F12` para abrir o DevTools
2. Vá na aba **Application** (ou **Aplicativo**)
3. Clique em **Clear storage** (ou **Limpar armazenamento**)
4. Marque todas as opções
5. Clique em **Clear site data** (ou **Limpar dados do site**)
6. Recarregue a página

Ou simplesmente execute no Console:

```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

## Passo 4: Testar o Redirecionamento

Após deletar a loja e limpar o cache:

1. Acesse `http://localhost:5176/`
2. A página deve **automaticamente redirecionar** para `/admin/login`
3. Se não redirecionar, verifique o console do navegador para erros

## O que foi alterado no código:

1. ✅ **Script SQL criado** (`DELETAR-LOJA-FEQUEIJAO.sql`) - deleta completamente a loja FÉQUEIJÃO
2. ✅ **Componente RootRedirect criado** (`src/components/RootRedirect.tsx`) - redireciona "/" para "/admin/login"
3. ✅ **App.tsx atualizado** - a rota "/" agora usa o RootRedirect ao invés de Home

## Problemas Comuns:

### Se ainda aparecer a página FÉQUEIJÃO:
- Limpe o cache do navegador completamente
- Execute `sessionStorage.clear()` no console
- Reinicie o servidor de desenvolvimento

### Se não redirecionar para login:
- Verifique se o componente RootRedirect está sendo importado corretamente
- Verifique o console do navegador para erros
- Certifique-se de que a rota "/" está antes da rota "/:storeSlug" no App.tsx

