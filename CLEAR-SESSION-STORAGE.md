# Como limpar o sessionStorage manualmente

Se você ainda estiver vendo a página FÉQUEIJÃO ao recarregar, execute este comando no console do navegador (F12):

```javascript
sessionStorage.removeItem('currentStoreSlug');
location.reload();
```

Ou simplesmente:
```javascript
sessionStorage.clear();
location.reload();
```

Isso limpará qualquer loja salva no cache do navegador e forçará o carregamento da loja correta baseado na URL.

