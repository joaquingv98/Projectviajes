# Milestone 1 — Documentación y planificación base

## Objetivo
Establecer la documentación necesaria para que cualquier desarrollador pueda entender, configurar y contribuir al proyecto. Documentar el presente (qué hay) y el futuro (roadmap).

## Tareas

- [x] Crear `README.md` con descripción del proyecto, setup, variables de entorno y flujo de la app
- [x] Crear `.env.example` documentando las variables de entorno requeridas
- [x] Crear `ROADMAP.md` con los próximos milestones en pseudocódigo
- [x] Verificar que `.env` está en `.gitignore` (no subir credenciales)

## Mapa de Ruta / Pseudocódigo

```
README.md:
  - Título y descripción (1 párrafo)
  - Requisitos (Node, npm)
  - Instalación: npm install
  - Configuración: copiar .env.example a .env
  - Scripts: dev, build, lint
  - Flujo de la app (Setup → Identify → Lobby → Draw → Bracket → Match → Voting → Winner)
  - Supabase: referencias a supabase_setup.sql

.env.example:
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=tu_anon_key

ROADMAP.md:
  - Lista de milestones futuros (2-8) con descripción breve
  - Pseudocódigo de cada uno (2-3 líneas)
```

## Criterios de Aceptación

- [x] Un desarrollador nuevo puede clonar el repo y tener el proyecto funcionando en menos de 5 minutos siguiendo el README
- [x] Las variables de entorno están documentadas y no hay credenciales reales en el repositorio
- [x] Existe un ROADMAP que describe la dirección del proyecto
