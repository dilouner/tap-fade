# Registro de decisiones tecnicas

## ADR-001 - Desarrollo modular

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: TapFade se desarrollara por modulos independientes y validados.
- Motivo: Reducir riesgo, facilitar pruebas, documentar avances y mantener
  trazabilidad con el FRU.
- Consecuencia: Cada modulo requiere implementacion, pruebas, evidencia y
  documentacion antes de considerarse terminado.

## ADR-002 - Firebase como backend inicial

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: Usar Firebase Auth, Firestore, Storage y FCM en la primera version.
- Motivo: Acelera autenticacion, datos en tiempo real, notificaciones y
  escalabilidad inicial.
- Consecuencia: El proyecto dependera de costos, limites y disponibilidad de
  servicios Firebase/Google.

## ADR-003 - Expo como punto de arranque

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: Iniciar con Expo para acelerar desarrollo y pruebas en dispositivos.
- Motivo: Reduce friccion inicial y permite validar rapido el vertical slice.
- Consecuencia: Si aparece una dependencia nativa no soportada, se evaluara
  migrar o usar desarrollo nativo gestionado.

## ADR-004 - Navegacion movil por rol

- Estado: Aprobada.
- Fecha: 2026-07-13.
- Decision: Separar la experiencia movil en navegadores por rol: cliente,
  barbero y dueno, cada uno con tabs principales y pantallas internas por
  stack.
- Motivo: El MVP operativo mezclaba demasiadas responsabilidades en una sola
  pantalla y dificultaba validar flujos reales de reserva, agenda y operacion.
- Consecuencia: Las nuevas vistas deben mantenerse trazadas por modulo y
  probarse con lint, typecheck y Jest antes de integrarse.

## ADR-005 - Imagenes e iconografia para UI TapFade

- Estado: Aprobada.
- Fecha: 2026-07-13.
- Decision: Agregar `photoUrl` a barberias y barberos, usar fallbacks locales
  de marca y usar `@expo/vector-icons` para tabs, acciones y estados.
- Motivo: El manual de identidad muestra una experiencia movil visual, con
  fotos reales, CTAs claros e iconografia reconocible.
- Consecuencia: La carga/subida de archivos queda fuera de esta iteracion; las
  imagenes se persistiran como URL y se validaran con estados fallback.
