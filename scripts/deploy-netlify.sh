#!/usr/bin/env bash
# Deploy a Netlify - Social Trip Tournament
# Uso: ./scripts/deploy-netlify.sh

set -e

echo "🔨 Building..."
npm run build

echo "📦 Deploying to Netlify..."
npx netlify deploy --prod --dir=dist

echo "✅ ¡Despliegue completado! Tu app ya está en vivo para móvil."
