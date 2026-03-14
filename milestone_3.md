# Milestone 3 — Errores, estados de carga y feedback

## Objetivo
Eliminar `alert()` y reemplazarlo por notificaciones en la UI. Gestionar estados de carga en las acciones asíncronas clave. Mejorar la experiencia cuando algo falla.

> **Nota:** El modo "Jugar vs máquina" se mantiene para pruebas rápidas (puede eliminarse en el futuro).

## Tareas

- [x] Instalar librería de toasts (`sonner`)
- [x] Añadir `<Toaster />` en la raíz de la app
- [x] Reemplazar `alert()` en `useMatchActions` por `toast.error()`
- [x] Crear componente `LoadingOverlay` reutilizable
- [x] Estado loading en crear sala: `TournamentSetup` muestra loading mientras `createLobby`
- [x] Estado loading en sorteo: `LobbyScreen` ya tiene `starting`; asegurar que `startDraw` maneje errores con toast
- [x] Estado loading en enviar propuesta: `MatchSubmission` ya tiene `submitting`; verificar cobertura
- [x] Estado loading en votar: `VotingScreen` — añadir feedback al confirmar voto
- [x] Manejar errores en `startDraw` (Supabase puede fallar) con toast
- [x] ErrorBoundary ya existe; verificar que envuelve correctamente toda la app

## Mapa de Ruta / Pseudocódigo

```
package.json:
  + "sonner"

main.tsx / App.tsx:
  import { Toaster } from 'sonner'
  <Toaster position="top-center" richColors />

useMatchActions.ts:
  import { toast } from 'sonner'
  createLobby: catch -> toast.error('Error al crear la sala...') en lugar de alert()

LoadingOverlay.tsx (nuevo):
  props: { visible: boolean, message?: string }
  render: overlay con spinner + mensaje, z-index alto

TournamentSetup:
  state: creatingLobby = false
  handleStart/handleSoloStart:
    setCreatingLobby(true)
    await onStart(...)  // onStart debe devolver Promise
    setCreatingLobby(false)
  onStart prop: (participants, currentUser?) => Promise<void>

App.handleCreateLobby:
  try { await createLobby(...) } catch { toast.error(...); return }
  // Ya maneja navegación en éxito

LobbyScreen:
  handleStart: try { await onStart() } catch { toast.error(...) } finally { setStarting(false) }
  onStart debe propagar errores

VotingScreen:
  handleConfirm: estado votingInProgress, deshabilitar botón, toast.success al confirmar
```

## Criterios de Aceptación

- [x] No existe ningún `alert()` en el código
- [x] Errores (crear sala, sorteo, red) se muestran como notificación toast
- [x] Crear sala muestra indicador de carga mientras se procesa
- [x] Iniciar sorteo muestra indicador de carga (ya existe)
- [x] Enviar propuesta muestra "Enviando..." (ya existe)
- [x] Confirmar voto muestra feedback (loading o toast de éxito)
- [x] Si algo falla, el usuario puede reintentar sin recargar la página
- [x] ErrorBoundary captura errores React y muestra pantalla de recuperación
