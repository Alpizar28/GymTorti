# Configuración de la Aplicación

Este directorio contiene la configuración central de la aplicación UI.

## `app.config.ts`

Archivo principal de configuración que contiene todos los valores predeterminados de la aplicación.

### Contenido

- **gymName**: Nombre visible del gimnasio
- **gymTagline**: Subtítulo o eslogan del gimnasio
- **logo**: Ruta al logo del gimnasio
- **theme**: Colores principales del tema (gradientes)
- **poweredByJokem**: Configuración del footer "Powered by Jokem"

### Cómo editar

1. Abre el archivo `app.config.ts`
2. Modifica los valores según tus necesidades
3. Guarda el archivo
4. Los cambios se aplicarán automáticamente cuando se importe la configuración

### Ejemplo de uso

```typescript
import { appConfig } from '@/config/app.config';

// Usar el nombre del gimnasio
console.log(appConfig.gymName); // "MasterGym"

// Usar los colores del tema
const gradient = `linear-gradient(to right, ${appConfig.theme.primary.from}, ${appConfig.theme.primary.to})`;
```

## Próximos pasos

En las siguientes tareas, esta configuración se integrará en:
- Header (Tarea 2)
- Footer (Tarea 3)
