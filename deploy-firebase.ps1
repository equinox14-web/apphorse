# Script de déploiement Firebase
# Usage: deploy-firebase.ps1 "Message de commit"

param(
    [string]$message = "Build deployment"
)

Write-Host "🔄 Déploiement Firebase en cours..." -ForegroundColor Cyan

# Vérifier si Git est initialisé
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git n'est pas initialisé" -ForegroundColor Red
    exit 1
}

# Vérifier si Firebase CLI est installé
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI n'est pas installé. Installez-le: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Build l'app
Write-Host "🔨 Build de l'application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}

# Ajouter les fichiers
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commiter
Write-Host "💾 Commit: $message" -ForegroundColor Yellow
git commit -m $message

# Pusher
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
git push

# Déployer sur Firebase
Write-Host "🔥 Déploiement sur Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "📊 Vérifier sur: https://console.firebase.google.com" -ForegroundColor Cyan
