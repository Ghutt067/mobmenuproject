# Guia para Enviar Código para o GitHub

## Passo 1: Instalar o Git

### Opção A: Via winget (Windows Package Manager)
```powershell
winget install Git.Git
```

### Opção B: Download Manual
1. Acesse: https://git-scm.com/download/win
2. Baixe e instale o Git
3. Reinicie o terminal após a instalação

## Passo 2: Configurar o Git (primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```

## Passo 3: Inicializar o Repositório

```bash
# Inicializar o repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "feat: adicionar design clean para StoreInfo e campos editáveis de localização/horário"
```

## Passo 4: Conectar ao GitHub

### Se você já tem um repositório no GitHub:
```bash
# Adicionar o repositório remoto (substitua SEU_USUARIO e SEU_REPOSITORIO)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

### Se você precisa criar um novo repositório:
1. Acesse https://github.com/new
2. Crie um novo repositório (não inicialize com README)
3. Copie a URL do repositório
4. Execute:
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

## Alterações Realizadas Nesta Sessão

- ✅ Design clean e minimalista para StoreInfo (localização e horário)
- ✅ Campos editáveis na página de Configurações do Admin
- ✅ Serviço para atualizar informações da loja
- ✅ Correções nas opções de produtos
- ✅ Melhorias na validação e renderização de opções

