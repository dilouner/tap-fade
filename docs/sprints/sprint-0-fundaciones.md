# Sprint 0 - Fundaciones del proyecto

## Objetivo

Preparar la base tecnica, documental y visual para construir TapFade por
modulos verificables.

## Alcance

- Documentacion base del proyecto.
- Decisiones tecnicas iniciales.
- Proyecto movil React Native con Expo.
- Estructura modular.
- Tema visual TapFade.
- Pipeline basico de validacion.

## Checklist

| Estado | Actividad |
|---|---|
| Completado | Crear documentacion base en `/docs`. |
| Completado | Definir arquitectura inicial. |
| Completado | Definir mapa de modulos. |
| Completado | Definir plan de pruebas inicial. |
| Completado | Aprobar Expo como punto de arranque. |
| Completado | Aprobar Firebase como backend inicial. |
| Completado | Crear proyecto movil en `/mobile`. |
| Completado | Configurar estructura modular de codigo. |
| Completado | Configurar tema visual TapFade. |
| Completado | Redisenar pantalla inicial de login con mayor apego al manual de marca. |
| Completado | Agregar pipeline CI basico. |
| Completado | Ejecutar primera validacion tecnica. |

## Validaciones ejecutadas

| Fecha | Validacion | Resultado |
|---|---|---|
| 2026-06-16 | `npm run typecheck` en `/mobile` | Exitoso |
| 2026-06-16 | `npm run typecheck` tras cambio a pantalla de login | Exitoso |
| 2026-06-16 | `npm run typecheck` tras retirar login y bajar a Expo SDK 55 | Exitoso |
| 2026-06-16 | `npm run typecheck` tras bajar a Expo SDK 54 | Exitoso |
| 2026-06-16 | `npm run typecheck` tras redisenar login | Exitoso |
| 2026-06-16 | `npm run typecheck` tras bajar a Expo SDK 53 | Exitoso |

## Observaciones

- `npm install` reporto 10 vulnerabilidades moderadas en dependencias. Se
  revisaran antes de preparar una version distribuible.
- El pipeline inicial queda en `.github/workflows/mobile-ci.yml` y ejecuta
  `npm ci` y `npm run typecheck`.
- Se intento Expo SDK 55, pero el dispositivo siguio mostrando
  incompatibilidad. El proyecto quedo finalmente en Expo SDK 54 para mejorar
  compatibilidad con Expo Go.
- Se bajo nuevamente a Expo SDK 53 al aparecer error de runtime en celular:
  `private properties are not supported`.
- La pantalla de login visual fue redisenada con base en la identidad TapFade.
  La conexion real con Firebase queda pendiente para el modulo `Auth + Roles`.

## Criterio de salida

Sprint 0 termina cuando el proyecto movil inicia correctamente, tiene estructura
modular, tema base, scripts de validacion y documentacion actualizada.
