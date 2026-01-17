# Script de déploiement rapide
# Usage: deploy.ps1 "Message de commit"

param(
    [string]$message = "🚀 Update"
)

Write-Host "🔄 Déploiement en cours..." -ForegroundColor Cyan

# Vérifier si Git est initialisé
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git n'est pas initialisé. Exécutez d'abord 'git init'" -ForegroundColor Red
    exit 1
}

# Ajouter tous les fichiers
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commiter
Write-Host "💾 Commit: $message" -ForegroundColor Yellow
git commit -m $message

# Pusher
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
git push

Write-Host "✅ Déploiement terminé! Vercel va builder automatiquement." -ForegroundColor Green
Write-Host "📊 Vérifier sur: https://vercel.com/dashboard" -ForegroundColor Cyan
