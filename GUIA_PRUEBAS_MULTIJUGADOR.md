# Guía de pruebas multijugador

Antes de Prioridad 6 (deploy), valida que el flujo con usuarios reales funciona correctamente.

## Requisitos

- `npm run dev` en ejecución (o la app desplegada)
- **Dos sesiones** de navegador:
  - Opción A: Una ventana normal + una ventana de incógnito
  - Opción B: Dos dispositivos (móvil + PC) en la misma red

## Checklist: flujo Crear torneo + Unirme

### Paso 1 — Creador (ventana 1)

- [ ] Ir a la app (ej. `http://localhost:5173`)
- [ ] Pestaña **Crear torneo**
- [ ] Número de participantes: **2** (más rápido para probar)
- [ ] Nombres: **Ana** y **Bruno**
- [ ] Click en **Crear sala de espera**
- [ ] Aparece pantalla **¿Quién eres tú?**
- [ ] Seleccionar **Ana**
- [ ] Llegar a **Sala de espera**
- [ ] Copiar la URL completa (ej. `http://localhost:5173/#xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Paso 2 — Segundo jugador (ventana 2 / incógnito)

- [ ] Ir a la app (misma URL base)
- [ ] Pestaña **Unirme**
- [ ] Pegar el **código** (la parte después de `#` de la URL) o la URL completa
- [ ] Click en **Unirme**
- [ ] Aparece **¿Quién eres tú?**
- [ ] Seleccionar **Bruno** (el nombre debe estar disponible)
- [ ] Llegar a **Sala de espera** (debe verse "2 participantes conectados" o similar)

### Paso 3 — Sorteo y partido

- [ ] En ventana 1 (creador): click en **Comenzar sorteo**
- [ ] Ambas ventanas ven la animación del sorteo
- [ ] Aparece **Cuadro del Torneo** con el partido Ana vs Bruno
- [ ] Click en el partido
- [ ] Cada uno envía su **propuesta** (enlace de vuelo, precio, destino)
- [ ] Ambos ven la pantalla de **votación**
- [ ] Cada uno vota por una propuesta
- [ ] Se resuelve el ganador y vuelve al bracket (o final si era 2 participantes)

### Criterios de éxito

- [ ] No hay errores en consola del navegador
- [ ] Los nombres no se pueden duplicar (si Ana está ocupada, Bruno no la puede elegir)
- [ ] Las propuestas se envían correctamente
- [ ] Los votos se registran
- [ ] El ganador avanza correctamente

## Si algo falla

- **"Ese nombre ya ha sido reclamado"**: Normal si alguien ya eligió ese nombre. Elige otro.
- **"No se encontró el torneo"**: Verifica que pegaste el código completo (UUID de 36 caracteres).
- **Propuesta no se envía**: Comprueba que Supabase tiene la migración de Prioridad 4 aplicada.

## Resultado

Cuando completes el checklist sin errores, el flujo multijugador está validado para Prioridad 6.
