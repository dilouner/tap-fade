# Auditoría de dependencias — demo premium

Fecha: 2026-08-11

- Expo Doctor: 21/21 comprobaciones correctas con Expo 56.0.19.
- `npm audit`: 19 avisos transitivos (12 altos y 7 moderados).
- `npm audit --omit=dev`: 18 avisos transitivos (11 altos y 7 moderados).
- Los avisos proceden de herramientas de compilación Expo/Metro (`image-size`) y configuración nativa (`uuid`/`xcode`), no de código de negocio ni de datos procesados en tiempo de ejecución por TapFade.
- La única corrección automática propuesta usa `npm audit --force` y baja Expo a 53.0.27. Se rechazó por ser un cambio incompatible y regresivo antes de la presentación.
- Se ejecutó `npm audit fix` sin cambios incompatibles y se mantienen los parches oficiales más recientes compatibles con Expo SDK 56.

Revisar nuevamente cuando Expo publique una cadena Metro/config-plugins con las versiones transitivas corregidas.
