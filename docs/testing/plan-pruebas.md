# Plan de pruebas inicial

## Objetivo

Asegurar que cada modulo de TapFade sea verificable, trazable y estable antes
de avanzar al siguiente.

## Niveles de prueba

- Unitarias: funciones, validaciones y transformaciones.
- Integracion: servicios del modulo y acceso a datos.
- Funcionales: flujos completos segun FRU.
- Seguridad: acceso por rol y pantallas protegidas.
- Usabilidad: agendado sin ayuda y en menos de 2 minutos.
- Rendimiento: operaciones criticas p95 <= 3 segundos.

## Criterios de cierre por modulo

- Casos de prueba definidos.
- Pruebas ejecutadas y documentadas.
- Errores criticos corregidos.
- Evidencia anexada en bitacora o reporte.
- Requerimientos trazados.

## Herramientas actuales

- TypeScript: validacion estatica con `npm run typecheck` en `/mobile`.
- ESLint + eslint-config-expo: validacion estatica de calidad con
  `npm run lint` en `/mobile`.
- Jest + jest-expo: ejecucion de pruebas unitarias en el proyecto Expo.
- React Native Testing Library: pruebas de comportamiento de componentes.
- GitHub Actions: pipeline `Mobile CI` en `.github/workflows/mobile-ci.yml`.

## Comandos de validacion

Ejecutar desde `/mobile`:

```bash
npm run lint
npm run typecheck
npm run test:ci
```

Para desarrollo local con Jest en modo observacion:

```bash
npm run test:watch
```

## Cobertura actual

| Area | Tipo | Estado | Evidencia |
|---|---|---|---|
| UI compartida | Unitarias | Configurado | `PrimaryButton-test.tsx`, `InputField-test.tsx`, `AppUI-test.tsx` |
| Auth + roles | Unitarias + integracion mockeada | Configurado | `authSession-test.ts`, `userProfile-test.ts`, `userProfileRepository-test.ts`, `AppShell-test.tsx` |
| Booking core | Unitarias + integracion mockeada | Configurado | `barberShop-test.ts`, `serviceCatalog-test.ts`, `availability-test.ts`, `appointmentRules-test.ts`, `appointmentRepository-test.ts`, `weeklyReport-test.ts` |
| Admin / soporte | Unitarias + integracion mockeada | Configurado | `userProfileRepository-test.ts`, `barberShopRepository-test.ts`, `appointmentRepository-test.ts` |
| Pipeline CI | Lint + typecheck + unitarias | Configurado | `.github/workflows/mobile-ci.yml` |

## Reglas para nuevas pruebas

- Cada modulo nuevo debe agregar pruebas unitarias para reglas, validaciones o
  componentes reutilizables.
- Las pruebas de integracion se agregaran cuando el modulo tenga servicios,
  repositorios o acceso a Firebase.
- Todo pull request debe reportar los comandos ejecutados y su resultado.
- Todo pull request que afecte `/mobile` debe pasar lint, typecheck y pruebas
  unitarias antes de integrarse.
- Si una prueba genera cobertura, el directorio `coverage/` no debe versionarse.
- Las pruebas de Auth en CI usan mocks de Firebase/Google; la validacion real
  de Google Sign-In se ejecuta manualmente en development build.

## Casos base del FRU

| ID | Escenario |
|---|---|
| CP-001 | Registro e inicio de sesion con Google |
| CP-002 | Intento de acceso sin autenticacion |
| CP-003 | Registro de barberia |
| CP-004 | Configurar horarios disponibles |
| CP-005 | Crear, editar y eliminar servicio |
| CP-006 | Busqueda por nombre y ubicacion |
| CP-007 | Agendar cita completa |
| CP-008 | Cancelar cita con anticipacion |
| CP-009 | Barbero confirma y rechaza cita |
| CP-010 | Recordatorios automaticos |
| CP-011 | Consultar historial de citas |
| CP-012 | Generar reporte de ocupacion |
| CP-013 | Navegar por tabs segun rol de usuario |
| CP-014 | Mostrar estados vacios para cliente, barbero y dueno |
| CP-015 | Visualizar fotos de barberia/barbero con fallback local |
| CP-016 | Admin cambia rol de usuario |
| CP-017 | Admin vincula usuario barbero a barbero de barberia |
| CP-018 | Admin activa o inactiva barberia |
| CP-019 | Admin monitorea citas globales y cambia estado por soporte |
