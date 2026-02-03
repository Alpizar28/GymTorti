import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import tenantConfig from '../../../../../tenant.setup.json';

// Configurar cliente de Supabase con permisos de Admin (Service Role)
// NOTA: Esto solo debe usarse en el servidor.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic'; // Asegurar que no se cachee

export async function GET(request: Request) {
    // Verificación básica de seguridad (DESACTIVADA TEMPORALMENTE PARA PRUEBAS)
    // const authHeader = request.headers.get('authorization');
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        const config = tenantConfig;

        // Verificar si el email está habilitado
        if (!config.email?.enabled || !config.email.reminders) {
            return NextResponse.json({ message: 'Email reminders disabled in config' });
        }

        const remindersConfig = config.email.reminders;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Obtener todos los clientes y sus subscripciones activas
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

        if (subscriptionsError) throw subscriptionsError;

        const results = [];

        for (const subscription of (subscriptions || [])) {
            const clientData = subscription.clients as any;
            const client = Array.isArray(clientData) ? clientData[0] : clientData;
            if (!client || !client.email) continue;

            const expirationDate = new Date(subscription.end_date);
            expirationDate.setHours(0, 0, 0, 0);

            // Calcular diferencia en días
            const diffTime = expirationDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Días faltantes (positivo) o pasados (negativo)

            let shouldSend = false;
            let templateType = '';

            // Regla: Días antes (ej: 3, 1)
            if (remindersConfig.daysBefore?.includes(diffDays)) {
                shouldSend = true;
                templateType = 'reminder_soon';
            }

            // Regla: El mismo día
            if (remindersConfig.sendOnDueDate && diffDays === 0) {
                shouldSend = true;
                templateType = 'due_today';
            }

            // Regla: Vencido (ej: venció ayer, diffDays = -1) (Opcional)
            // if (diffDays < 0 ...)

            if (shouldSend) {
                // Enviar correo
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

                const emailResult = await sendEmail({
                    to: client.email,
                    subject,
                    html,
                    fromName: config.email.fromName,
                    fromEmail: config.email.fromEmail
                });

                results.push({
                    email: client.email,
                    type: templateType,
                    success: emailResult.success,
                    error: emailResult.error
                });
            }
        }

        return NextResponse.json({
            processed: subscriptions.length,
            sent: results.length,
            details: results
        });

    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
