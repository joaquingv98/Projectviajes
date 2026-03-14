# Milestone 11 — Rediseño visual del setup inicial

## Objetivo
Adaptar la pantalla inicial del torneo a una estética más premium y profesional inspirada en la referencia proporcionada, sin alterar la estructura funcional existente ni añadir elementos ajenos al producto.

## Ajuste adicional

- [x] Refinar la botonera superior del `Bracket` para que tenga mejor cohesión visual con el nuevo diseño
- [x] Eliminar el bloque de compartir del `Bracket` y dar más protagonismo al botón de comenzar partido
- [x] Eliminar el bloque de compartir enlace en la vista `Bracket`
- [x] Mostrar un único mes en el selector de fechas del viaje
- [x] Eliminar el botón flotante blanco de la esquina inferior izquierda
- [x] Compactar el `setup` en móvil eliminando bloques informativos y acercando el inicio del torneo
- [x] Actualizar el titulo y subtitulo del hero manteniendo el diseño actual

## Tareas

- [x] Revisar la jerarquía visual actual de `TournamentSetup` y detectar qué piezas deben conservarse
- [x] Rediseñar el hero inicial con una composición más editorial y una tipografía más elegante
- [x] Ajustar la paleta global a tonos azul oscuro, cian y violeta con brillos sutiles
- [x] Refinar cards, tabs, inputs y CTAs para que tengan acabado más premium y coherente
- [x] Mantener intactos los flujos de crear torneo, unirse y modo solo
- [x] Validar que la app compila correctamente tras el rediseño

## Mapa de Ruta / Pseudocódigo

```text
leer TournamentSetup e index.css
identificar:
  hero actual
  estilos reutilizables
  componentes que no deben cambiar funcionalmente

crear nueva dirección visual:
  fondo oscuro profundo
  acentos azul/cian/violeta
  titular con palabras destacadas
  badge superior y bloques de apoyo discretos

reorganizar layout:
  desktop -> hero a la izquierda + panel funcional a la derecha
  mobile -> apilar sin romper accesibilidad ni formularios

refinar sistema visual:
  tabs con efecto pill
  card con borde luminoso suave
  inputs con más contraste
  botones primarios con gradiente profesional

validar:
  comprobar que create/join/solo siguen funcionando
  ejecutar build o typecheck
  corregir posibles errores de lint o tipos
```

## Criterios de Aceptación

- [x] La pantalla inicial transmite una estética claramente más profesional y cercana a la referencia
- [x] La estructura funcional sigue siendo la misma: crear, unirse y jugar solo
- [x] No se añaden elementos promocionales ajenos como botones de tiendas o bloques irrelevantes
- [x] El diseño sigue siendo usable en móvil y escritorio
- [x] La aplicación compila sin errores tras los cambios
