import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
    withErrorHandler,
    UnauthorizedError,
    ValidationError,
    logError,
    successResponse
} from '@/lib/api-error-handler';
import tenantConfig from '../../../../../tenant.setup.json';

// Configurar cliente de Supabase con permisos de Admin (Service Role)
// NOTA: Esto solo debe usarse en el servidor.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic'; // Asegurar que no se cachee

/**
 * Verifica las variables de entorno necesarias
 */
function validateEnvironment() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new ValidationError('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new ValidationError('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
}

/**
 * Verifica la autenticación del endpoint
 */
function verifyAuth(request: Request) {
    // Verificación básica de seguridad (DESACTIVADA TEMPORALMENTE PARA PRUEBAS)
    // const authHeader = request.headers.get('authorization');
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   throw new UnauthorizedError('Invalid or missing authorization');
    // }
}

/**
 * Handler principal del endpoint de reminders
 */
async function handleReminders(_request: Request) {
    // Validaciones iniciales
    validateEnvironment();
    verifyAuth(_request);

    const config = tenantConfig;

    // Verificar si el email está habilitado
    if (!config.email?.enabled || !config.email.reminders) {
        return NextResponse.json({
            message: 'Email reminders disabled in config',
            processed: 0,
            sent: 0
        });
    }

    const remindersConfig = config.email.reminders;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener subscripciones activas
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from('subscriptions')
        .select(`
      id,
      client_id,
      end_date,
      active,
      clients (
        id,
        first_name,
        last_name,
        email,
        status
      )
    `)
        .eq('active', true)
        .eq('clients.status', 'active');

    if (subscriptionsError) {
        logError(subscriptionsError, 'Supabase Query Error');
        throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
        return successResponse({
            processed: 0,
            sent: 0,
            details: []
        }, 'No active subscriptions found');
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Procesar cada subscripción
    for (const subscription of subscriptions) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clientData = subscription.clients as any;
            const client = Array.isArray(clientData) ? clientData[0] : clientData;

            if (!client || !client.email) {
                console.warn(`Skipping subscription ${subscription.id}: missing client or email`);
                continue;
            }

            const expirationDate = new Date(subscription.end_date);
            expirationDate.setHours(0, 0, 0, 0);

            // Calcular diferencia en días
            const diffTime = expirationDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let shouldSend = false;
            let templateType = '';

            // Determinar si debe enviar recordatorio
            if (remindersConfig.daysBefore?.includes(diffDays)) {
                shouldSend = true;
                templateType = 'reminder_soon';
            } else if (remindersConfig.sendOnDueDate && diffDays === 0) {
                shouldSend = true;
                templateType = 'due_today';
            }

            if (shouldSend) {
                const dateStr = expirationDate.toLocaleDateString('es-CR');
                const subject = templateType === 'due_today'
                    ? `⚠️ Tu membresía vence HOY - ${config.branding.gymName}`
                    : `⏳ Recordatorio: Tu membresía vence el ${dateStr}`;

                const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Hola, ${client.first_name} 👋</h1>
            <p>Esperamos que estés disfrutando tus entrenamientos en <strong>${config.branding.gymName}</strong>.</p>
            <p>Este es un recordatorio amigable de que tu membresía vence el: <strong>${dateStr}</strong>.</p>
            <p>¡Te esperamos para renovar y seguir cumpliendo tus metas!</p>
            <br/>
            <p>Saludos,<br/>El equipo de ${config.branding.gymName}</p>
          </div>
        `;

                console.log(`Sending email to ${client.email} (${templateType})`);

                try {
                    const emailResult = await sendEmail({
                        to: client.email,
                        subject,
                        html,
                        fromName: config.email.fromName,
                        fromEmail: config.email.fromEmail
                    });

                    if (emailResult.success) {
                        successCount++;
                    } else {
                        failureCount++;
                    }

                    results.push({
                        email: client.email,
                        type: templateType,
                        success: emailResult.success,
                        error: emailResult.error
                    });

                } catch (emailError) {
                    failureCount++;
                    logError(emailError, `Email sending to ${client.email}`);
                    results.push({
                        email: client.email,
                        type: templateType,
                        success: false,
                        error: emailError instanceof Error ? emailError.message : 'Unknown email error'
                    });
                }

                // Delay para evitar rate limit (Resend: 2 emails/segundo en plan gratuito)
                await new Promise(resolve => setTimeout(resolve, 600));
            }

        } catch (subscriptionError) {
            // Log pero continúa con las siguientes subscripciones
            logError(subscriptionError, `Processing subscription ${subscription.id}`);
            failureCount++;
        }
    }

    return successResponse({
        processed: subscriptions.length,
        sent: results.length,
        success: successCount,
        failed: failureCount,
        details: results
    }, `Processed ${subscriptions.length} subscriptions, sent ${successCount} emails successfully`);
}

// Exportar con el wrapper de manejo de errores
export const GET = withErrorHandler(handleReminders, 'GET /api/cron/reminders');
