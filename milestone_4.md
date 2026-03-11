# Milestone 4 — Foto IA del grupo en el destino (Opción A)

## Objetivo
Al terminar el torneo, permitir generar con IA una imagen de un grupo de amigos disfrutando en el destino elegido. Solo texto (sin foto de referencia).

## Tareas

- [x] Crear Supabase Edge Function `generate-travel-image` que llame a OpenAI Images API (DALL-E 3)
- [x] Actualizar flujo: `winner` state incluye `tournamentId`, `onTournamentCompleted` pasa ambos
- [x] `useTournamentData`: `getTournamentIdFromScreen` retorna `tournamentId` para `winner`
- [x] Crear `src/lib/generateTravelImage.ts` para invocar la Edge Function
- [x] `WinnerScreen`: añadir botón "Generar foto con IA", estado loading/error/imagen, mostrar resultado
- [x] Documentar: configurar `OPENAI_API_KEY` en Supabase para la Edge Function

## Criterios de Aceptación

- [x] En la pantalla de ganador aparece el botón "Generar foto con IA"
- [x] Al pulsar, se muestra un indicador de carga mientras se genera
- [x] Si la API responde bien, se muestra la imagen generada con opción de descargar
- [x] Si hay error (API key no configurada, límite, etc.), se muestra mensaje amigable
- [x] El prompt incluye destino y número de participantes
- [x] La API key de OpenAI no se expone en el cliente (solo en Edge Function)

## Pseudocódigo

```
Edge Function generate-travel-image:
  POST body: { destination, numParticipants }
  prompt = "Un grupo de {numParticipants} amigos disfrutando de sus vacaciones en {destination}. Foto de viaje alegre, estilo fotográfico realista, ambiente festivo."
  response = fetch(OpenAI /v1/images/generations, { model: dall-e-3, prompt, size: 1024x1024 })
  return { url: response.data[0].url }

WinnerScreen:
  - Recibe winningProposal, participants (o numParticipants)
  - Estado: generatedImageUrl, loading, error
  - Botón onClick -> invoke Edge Function -> set generatedImageUrl o error
  - Si generatedImageUrl: mostrar img + link descarga
```
