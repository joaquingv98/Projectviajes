# Prioridad 6 — Deploy a producción

## Objetivo
Desplegar la aplicación en un entorno accesible por URL pública (Netlify) para que el flujo multijugador funcione en producción con Supabase, y dejar documentado el proceso de despliegue y las variables de entorno necesarias.

## Estado actual detectado

- [ ] Validado el flujo multijugador en local según `GUIA_PRUEBAS_MULTIJUGADOR.md`
- [ ] Confirmado que las migraciones de Supabase (Prioridad 4 y la de voters) están aplicadas en el proyecto real
- [ ] Scripts de deploy existentes: `scripts/deploy-netlify.sh` y `scripts/deploy-netlify.bat`
- [ ] Configuración Netlify en `netlify.toml` (build, SPA redirects, headers)
- [ ] Variables de entorno de producción pendientes de configurar en Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## Dependencias previas

- **Prioridad 1**: E2E crítico alineado (opcional para deploy, útil para CI)
- **Prioridad 2**: Lint en verde
- **Prioridad 3**: Seguridad mínima (claim_participant, submit_proposal_secure, cast_vote_secure)
- **Prioridad 4**: Migración de Supabase aplicada en el proyecto real
- **Migración voters**: `20260314150000_add_voters_and_flexible_participants.sql` aplicada si se usan votantes extra y bracket flexible
- **Guía multijugador**: Completar el checklist de `GUIA_PRUEBAS_MULTIJUGADOR.md` antes del deploy para validar el flujo con dos sesiones

## Tareas

- [ ] Ejecutar el checklist de `GUIA_PRUEBAS_MULTIJUGADOR.md` en local (crear torneo + unirse + sorteo + propuestas + votación)
- [ ] Verificar que no hay errores en consola durante el flujo multijugador
- [ ] Tener cuenta en [Netlify](https://www.netlify.com/) y proyecto vinculado (o crear uno)
- [ ] Configurar en Netlify las variables de entorno de build:
  - `VITE_SUPABASE_URL` = URL del proyecto Supabase
  - `VITE_SUPABASE_ANON_KEY` = anon key del proyecto Supabase
- [ ] Ejecutar deploy: `./scripts/deploy-netlify.sh` (o `scripts\deploy-netlify.bat` en Windows)
- [ ] Confirmar que la URL de producción carga la app y que el flujo (crear torneo, identificar, proponer, votar) funciona contra Supabase
- [ ] Documentar la URL de producción y cualquier paso extra (dominio, HTTPS) si aplica

## Orden de implementación recomendado

1. Validar flujo en local con la guía multijugador (dos ventanas o dos dispositivos).
2. Aplicar en Supabase la migración de voters si aún no está: `supabase/migrations/20260314150000_add_voters_and_flexible_participants.sql`.
3. En Netlify: crear o seleccionar sitio, configurar variables de entorno `VITE_SUPABASE_*`.
4. En la máquina local: `npm run build` y, si todo va bien, ejecutar el script de deploy.
5. Probar en la URL de producción: crear torneo, unirse desde otra sesión, sorteo, propuestas y votación.
6. Marcar esta prioridad como completada y anotar la URL en este documento.

## Mapa de Ruta / Pseudocódigo

```text
Validar pre-deploy
  seguir GUIA_PRUEBAS_MULTIJUGADOR.md
  dos sesiones: creador + quien se une
  comprobar propuestas y votos sin errores en consola

Comprobar Supabase
  migración Prioridad 4 aplicada (participant_claims, RPCs)
  migración voters aplicada si se usa bracket flexible

Netlify
  login / link del proyecto (netlify link o dashboard)
  Site settings → Environment variables
    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY

Deploy
  npm run build
  npx netlify deploy --prod --dir=dist
  (o usar scripts/deploy-netlify.sh / deploy-netlify.bat)

Validar producción
  abrir URL del sitio Netlify
  crear torneo, unirse, sorteo, propuesta, voto
  comprobar que los datos llegan a Supabase (mismo proyecto que en local)
```

## Criterios de Aceptación

- [ ] El flujo multijugador (crear + unirse + sorteo + propuestas + votación) está validado en local según la guía.
- [ ] La app se despliega en Netlify sin fallos de build.
- [ ] Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configuradas en Netlify y la app en producción usa el mismo proyecto Supabase.
- [ ] En la URL de producción, un usuario puede crear un torneo, otro unirse con el código, y ambos pueden completar sorteo, propuestas y votación sin errores visibles.
- [ ] La prioridad 6 queda documentada en este archivo con la URL de producción (cuando se tenga).

## Implementación realizada

- [ ] Checklist multijugador ejecutado
- [ ] Deploy a Netlify ejecutado
- [ ] Prueba en producción exitosa
- [ ] URL de producción anotada: _______________________

## Referencias

- Guía de pruebas multijugador: `GUIA_PRUEBAS_MULTIJUGADOR.md`
- Scripts de deploy: `scripts/deploy-netlify.sh`, `scripts/deploy-netlify.bat`
- Configuración Netlify: `netlify.toml`
- Variables de entorno usadas en la app: `src/lib/supabase.ts` (VITE_SUPABASE_*)
- Prioridad 4 (migración Supabase): `prioridad4.md`
- Migración voters: `supabase/migrations/20260314150000_add_voters_and_flexible_participants.sql`
