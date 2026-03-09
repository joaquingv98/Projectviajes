# Torneo de Viajes

Aplicación web para decidir el próximo viaje en grupo mediante un torneo de votación. Los participantes compiten en parejas con propuestas de vuelos; el grupo vota y el ganador avanza hasta la final.

## Requisitos

- Node.js 18+
- npm (o yarn/pnpm)
- Cuenta en [Supabase](https://supabase.com)

## Instalación

```bash
npm install
```

## Configuración

1. Crea un proyecto en Supabase.
2. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

3. Edita `.env` con tus credenciales de Supabase.
4. Ejecuta el script SQL `supabase_setup.sql` en el SQL Editor de Supabase para crear las tablas.

## Scripts

| Comando       | Descripción                    |
|---------------|--------------------------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run preview` | Sirve el build localmente     |
| `npm run lint` | Ejecuta ESLint                |
| `npm run typecheck` | Verifica tipos TypeScript  |

## Flujo de la aplicación

1. **Setup** — Crear torneo (2, 4 u 8 participantes) o unirse con código
2. **Identify** — Introducir nombre para identificarse
3. **Lobby** — Sala de espera; el creador inicia el sorteo
4. **Draw** — Animación del emparejamiento aleatorio
5. **Bracket** — Cuadro del torneo; clic en partidos activos
6. **Match** — Los jugadores envían propuestas de viaje (vuelo, precio, destino, fechas)
7. **Voting** — Todos votan por una propuesta (5 min o hasta que todos voten)
8. **Tiebreak** — Si hay empate: Minuto de Oro → Segunda votación → Ruleta
9. **Winner** — Propuesta ganadora del torneo

## Estructura del proyecto

```
src/
├── App.tsx              # Orquestador principal
├── components/          # Pantallas y componentes UI
├── lib/
│   └── supabase.ts      # Cliente Supabase y tipos
└── index.css
```

## Supabase

Las tablas necesarias se crean ejecutando `supabase_setup.sql` en el SQL Editor de tu proyecto Supabase. Incluye: `tournaments`, `matches`, `proposals`, `votes`.
