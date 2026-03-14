# Milestone 10 — Animación Final Reveal

## Objetivo
Añadir una pantalla de transición dramática cuando el torneo llega a la gran final, para que los participantes perciban el momento como especial antes de proponer o votar.

## Tareas

- [x] Crear componente FinalRevealScreen con animación
- [x] Añadir estado 'finalReveal' a AppState
- [x] Interceptar navegación a final en useAutoNavigate (auto-redirección)
- [x] Interceptar handleMatchClick cuando se hace clic en la final
- [x] Interceptar handleStartMatch cuando se pulsa "Comenzar" en la final
- [x] Integrar FinalRevealScreen en App.tsx
- [x] Validar typecheck

## Criterios de Aceptación

- [x] Al llegar a la final (proponer o votar), se muestra la pantalla "¡LA GRAN FINAL!" antes de continuar
- [x] La pantalla muestra los nombres de los finalistas con animación
- [x] El botón "Entrar a la final" permite proseguir al flujo real (proponer o votar)
- [x] El auto-navegador redirige a FinalReveal cuando la final está en votación o proponiendo
- [x] Al pulsar "Comenzar" para la final, se muestra FinalReveal y luego se inicia el partido al confirmar

## Estado

- [x] Implementación completada
- [ ] Prueba manual del flujo completo
