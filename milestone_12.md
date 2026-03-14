# Milestone 12 — Bracket flexible y votantes sin propuesta

## Objetivo
Permitir torneos con un número no potencia de 2 de competidores entre 2 y 8 usando `byes`, y separar el rol de quien compite del rol de quien solo participa en la votación.

## Tareas

- [x] Revisar el modelo actual y separar conceptualmente `participants` (competidores) de `voters` (electorado)
- [x] Añadir soporte de datos y tipos para almacenar votantes extra además de los competidores
- [x] Mantener el alta inicial del torneo centrada solo en competidores
- [x] Adaptar el flujo de identificación para que cualquier votante pueda reclamar identidad
- [x] Implementar generación de bracket con `byes` para torneos de 3, 5, 6 y 7 competidores
- [x] Mantener la lógica de avance de ronda sin romper semifinales, final y desempates
- [x] Ajustar el `Bracket` para renderizar rondas según los partidos existentes en vez de asumir solo 2, 4 u 8
- [x] Hacer que la votación y el tiebreak se cierren usando el total de `voters`, no solo los competidores
- [x] Actualizar el lobby para mostrar quién compite y quién solo vota
- [x] Añadir o adaptar tests para los casos de bracket flexible y votantes extra
- [x] Validar tipos y lint en los archivos modificados
- [x] Compactar la pantalla de `TournamentSetup` para que el contenido principal entre mejor en escritorio
- [x] Sustituir la rejilla numérica por un selector deslizante de participantes entre 2 y 8
- [x] Unificar la etiqueta a `Número de participantes`
- [x] Añadir fallback al alta de torneos para compatibilidad con bases de datos sin la columna `voters`
- [x] Persistir la pantalla actual del torneo para restaurarla al recargar
- [x] Mover la adición de amigos votantes al `Bracket` con una acción dedicada tras el sorteo

## Mapa de Ruta / Pseudocódigo

```text
leer modelo actual
  tournament.participants = lista única usada para todo
  matches usan player1_name / player2_name
  votos se cierran con participants.length

definir nuevo contrato
  participants = competidores del bracket
  voters = competidores + votantes extra

actualizar persistencia
  migration:
    añadir tournaments.voters
    backfill voters = participants
    permitir num_participants entre 2 y 8
    validar claim_participant y cast_vote_secure contra voters

actualizar frontend
  crear torneo:
    recoger solo nombres de competidores
    guardar voters inicial = competidores

  bracket:
    mostrar accion "anadir amigos para votar"
    aceptar nombres extra
    actualizar voters = unique(voters actuales + extras)

generar bracket
  contestants = shuffle(participants)
  bracketSize = siguiente potencia de 2
  byeCount = bracketSize - contestants.length
  construir slots y emparejamientos iniciales
  si un slot enfrenta jugador vs BYE:
    avanzar automáticamente a la ronda siguiente
  persistir solo partidos jugables

adaptar flujo
  lobby e identificación muestran voters
  badge visual para competidor vs solo vota
  match submission solo para jugadores del partido
  voting/tiebreak usan voters para progreso y cierre
  auto navegación no envía a pantalla de propuesta a quien no juega ese match

validar
  tests de 3/6/7 competidores
  tests de votante extra sin propuesta
  revisar lints
```

## Criterios de Aceptación

- [x] Se puede crear un torneo con entre 2 y 8 competidores
- [x] Los torneos con 3, 5, 6 o 7 competidores generan un bracket válido con `byes`
- [x] Un usuario presente en `voters` pero no en `participants` puede identificarse y votar
- [x] Un votante extra no puede enviar propuesta ni aparecer en emparejamientos
- [x] La votación y la segunda votación de desempate esperan a todos los `voters`
- [x] El lobby e identificación reflejan correctamente quién compite y quién solo vota
- [x] El `Bracket` renderiza correctamente según los partidos existentes
- [x] La aplicación mantiene compilación y tipos correctos tras los cambios
