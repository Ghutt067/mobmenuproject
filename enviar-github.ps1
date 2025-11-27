# Script para enviar código para o GitHub
# Execute este script após criar o repositório no GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUrl
)

# Atualizar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Adicionar repositório remoto
Write-Host "Adicionando repositório remoto..." -ForegroundColor Yellow
git remote add origin $GitHubUrl

# Verificar se foi adicionado
Write-Host "Verificando repositório remoto..." -ForegroundColor Yellow
git remote -v

# Fazer push
Write-Host "Enviando código para o GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "✅ Código enviado com sucesso!" -ForegroundColor Green

