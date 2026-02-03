import { NextResponse } from 'next/server';

/**
 * Tipos de errores personalizados
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends ApiError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends ApiError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

/**
 * Logger de errores
 */
export function logError(error: unknown, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';

    if (error instanceof Error) {
        console.error(`${timestamp} ${contextStr}${error.name}: ${error.message}`);
        console.error(error.stack);
    } else {
        console.error(`${timestamp} ${contextStr}Unknown error:`, error);
    }
}

/**
 * Formatea errores de Supabase
 */
function formatSupabaseError(error: any): string {
    if (error?.message) {
        return `Database error: ${error.message}`;
    }
    if (error?.details) {
        return `Database error: ${error.details}`;
    }
    return 'Database operation failed';
}

/**
 * Wrapper principal para rutas API con manejo de errores robusto
 * 
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * }, 'GET /api/example');
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T,
    routeName?: string
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await handler(...args);
        } catch (error) {
            // Log el error
            logError(error, routeName);

            // Determinar el tipo de error y responder apropiadamente
            if (error instanceof ApiError) {
                return NextResponse.json(
                    {
                        error: error.message,
                        code: error.code,
                        timestamp: new Date().toISOString(),
                    },
                    { status: error.statusCode }
                );
            }

            // Errores de Supabase
            if (error && typeof error === 'object' && 'code' in error) {
                return NextResponse.json(
                    {
                        error: formatSupabaseError(error),
                        code: 'DATABASE_ERROR',
                        timestamp: new Date().toISOString(),
                    },
                    { status: 500 }
                );
            }

            // Error genérico
            const errorMessage = error instanceof Error ? error.message : 'Internal server error';
            return NextResponse.json(
                {
                    error: errorMessage,
                    code: 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }
    }) as T;
}

/**
 * Valida que los campos requeridos existan
 */
export function validateRequired(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
}

/**
 * Valida que un valor sea un email válido
 */
export function validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
}

/**
 * Helper para respuestas exitosas estandarizadas
 */
export function successResponse<T>(data: T, message?: string, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}

/**
 * Helper para respuestas de error estandarizadas
 */
export function errorResponse(
    message: string,
    statusCode: number = 500,
    code?: string
) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            code: code || 'ERROR',
            timestamp: new Date().toISOString(),
        },
        { status: statusCode }
    );
}
