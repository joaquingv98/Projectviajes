@echo off
REM Deploy a Netlify - Social Trip Tournament
REM Uso: scripts\deploy-netlify.bat

echo Building...
call npm run build

echo Deploying to Netlify...
call npx netlify deploy --prod --dir=dist

echo Despliegue completado. Tu app ya esta en vivo para movil.
