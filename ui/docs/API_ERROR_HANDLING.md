# Sistema de Manejo de Errores API

Sistema robusto de manejo de errores para endpoints API de Next.js.

## 📁 Ubicación

`src/lib/api-error-handler.ts`

## 🎯 Características

- ✅ **Tipos de errores personalizados** con códigos HTTP apropiados
- ✅ **Logging automático** con timestamps y contexto
- ✅ **Respuestas estandarizadas** con formato consistente
- ✅ **Wrapper `withErrorHandler`** para simplificar código
- ✅ **Validaciones comunes** incluidas
- ✅ **Compatibilidad con Supabase** para errores de BD

## 📝 Uso Básico

### 1. Crear un endpoint con manejo de errores

```typescript
import { 
  withErrorHandler, 
  successResponse,
  ValidationError 
} from '@/lib/api-error-handler';

async function handleMyEndpoint(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    throw new ValidationError('Missing required parameter: id');
  }

  // Tu lógica aquí
  const data = await fetchData(id);

  return successResponse(data, 'Data fetched successfully');
}

export const GET = withErrorHandler(handleMyEndpoint, 'GET /api/my-endpoint');
```

### 2. Tipos de errores disponibles

```typescript
// 400 - Bad Request
throw new ValidationError('Invalid input');

// 401 - Unauthorized
throw new UnauthorizedError('Invalid credentials');

// 404 - Not Found
throw new NotFoundError('User not found');

// 429 - Too Many Requests
throw new RateLimitError('Please slow down');

// 500 - Internal Server Error (genérico)
throw new ApiError('Something went wrong', 500, 'CUSTOM_CODE');
```

### 3. Validaciones comunes

```typescript
import { validateRequired, validateEmail } from '@/lib/api-error-handler';

// Validar campos requeridos
validateRequired(data, ['name', 'email', 'phone']);

// Validar formato de email
validateEmail(user.email);
```

### 4. Respuestas estandarizadas

```typescript
// Éxito
return successResponse(
  { user: userData }, 
  'User created successfully',
  201 // status code opcional (default: 200)
);

// Error manual
return errorResponse(
  'Something went wrong',
  500,
  'CUSTOM_ERROR_CODE'
);
```

## 🔍 Formato de Respuesta

### Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-02-03T14:00:00.000Z"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-03T14:00:00.000Z"
}
```

## 📊 Logging

El sistema automáticamente registra errores con:
- Timestamp
- Contexto (nombre del endpoint)
- Stack trace completo
- Tipo de error

Ejemplos de logs:

```
2026-02-03T14:00:00.000Z [GET /api/users] ValidationError: Missing required fields: email
2026-02-03T14:01:00.000Z [POST /api/orders] Database error: duplicate key value violates unique constraint
```

## 🛡️ Seguridad

- **No expone detalles internos** en producción
- **Registra errores** para debugging
- **Códigos de error** descriptivos pero seguros
- **Validación de entrada** para prevenir inyecciones

## 🚀 Mejores Prácticas

### ✅ DO

```typescript
// Usa withErrorHandler para todos los endpoints
export const GET = withErrorHandler(handleGet, 'GET /api/resource');

// Lanza errores específicos
throw new ValidationError('Email is required');

// Usa successResponse para consistencia
return successResponse(data);
```

### ❌ DON'T

```typescript
// No devuelvas respuestas sin formato
return NextResponse.json({ data }); // ❌

// No captures errores sin re-lanzar
try {
  await operation();
} catch (error) {
  console.log(error); // ❌ Se pierde el error
}

// No uses códigos de estado incorrectos
throw new ApiError('Not found', 200); // ❌
```

## 🔧 Extender el Sistema

### Crear un nuevo tipo de error

```typescript
export class PaymentError extends ApiError {
  constructor(message: string) {
    super(message, 402, 'PAYMENT_REQUIRED');
    this.name = 'PaymentError';
  }
}
```

### Agregar validación personalizada

```typescript
export function validatePhone(phone: string): void {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number format');
  }
}
```

## 📋 Checklist de Migración

Al migrar un endpoint existente:

- [ ] Importar `withErrorHandler` y helpers necesarios
- [ ] Envolver handler con `withErrorHandler`
- [ ] Reemplazar try-catch manual con errores específicos
- [ ] Usar `successResponse` para respuestas exitosas
- [ ] Agregar validaciones con helpers
- [ ] Probar casos de error
- [ ] Verificar logs en consola

## 🧪 Testing

```typescript
// Ejemplo de test
describe('GET /api/users', () => {
  it('should return error for missing id', async () => {
    const response = await GET(new Request('http://localhost/api/users'));
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});
```

## 📚 Referencias

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Error Handling Best Practices](https://www.rfc-editor.org/rfc/rfc7807)
