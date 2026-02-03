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
    // Verificación básica de seguridad (opcional, configurar CRON_SECRET en Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const config = tenantConfig;

        // Verificar si el email está habilitado
        if (!config.email?.enabled || !config.email.reminders) {
            return NextResponse.json({ message: 'Email reminders disabled in config' });
        }

        const remindersConfig = config.email.reminders;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Obtener clientes activos con fecha de vencimiento
        // Necesitamos clientes cuyo estado sea 'active' (o equivalente en DB)
        // Asumimos que la tabla es 'clients' y tiene 'email', 'status', 'first_name', 'expiration_date' (o similar)
        // En el código frontend vimos que leen 'status' y calculan vencimiento basado en pagos o si existe fechaVencimiento
        // PERO, en el frontend `fechaVencimiento` venía de `c.fechaVencimiento`, que no estaba en el SELECT simple de `loadAll`
        // Revisemos `loadAll` en FigmaApp.tsx: 
        // const { data: clientsData } = await supabase.from("clients").select("*");
        // Y luego calculaban la fecha? No, `c.fechaVencimiento` parece ser una propiedad mapeada o existente.
        // Si no tenemos columna 'expiration_date' en la tabla 'clients', esto es difícil.
        // En `FigmaApp.tsx`, `clientesAll` calcula `fechaVencimiento` basándose en... espera, `c.fechaVencimiento` venía del backend?
        // En `loadAll`:
        // setBackendClients(mappedClients);
        // Y `mappedClients`: 
        // fechaVencimiento: undefined (no está mapeado explícitamente en el primer map de `loadAll`)
        // Ah! `clientesAll` calcula `fechaVencimiento` usando `latestPaymentByClient`.
        // "const tipoMembresia = tipoPagoFromPayment(...); const fechaInicio = ...; const fechaVencimiento = c.fechaVencimiento ?? '';"
        // Parece que NO estamos guardando la fecha de vencimiento en la tabla `clients`. Se calcula al vuelo en base a pagos.

        // ESTO ES UN PROBLEMA PARA EL CRON JOB. El Cron no tiene el estado del frontend.
        // Necesitamos replicar la lógica de cálculo de vencimiento aquí o asumir que existe una vista/función.
        // Dado que es un template simple, replicaremos la lógica básica: Buscar el último pago y sumar 30 días (o lo que sea).

        // Obtener todos los clientes y sus pagos
        const { data: clients, error: clientsError } = await supabaseAdmin
            .from('clients')
            .select('id, first_name, last_name, email, phone, status')
            .eq('status', 'active'); // Solo activos

        if (clientsError) throw clientsError;

        const { data: payments, error: paymentsError } = await supabaseAdmin
            .from('payments')
            .select('client_id, date, amount, active_days, notes'); // Asumiendo estructura

        if (paymentsError) throw paymentsError;

        // Agrupar pagos por cliente para encontrar el último
        const clientPayments = new Map();
        payments?.forEach(p => {
            const current = clientPayments.get(p.client_id);
            if (!current || new Date(p.date) > new Date(current.date)) {
                clientPayments.set(p.client_id, p);
            }
        });

        const results = [];

        for (const client of clients) {
            if (!client.email) continue;

            const lastPayment = clientPayments.get(client.id);
            if (!lastPayment) continue; // Sin pagos, no podemos saber vencimiento

            // Calcular vencimiento
            // Lógica simplificada: Fecha pago + 30 días (o active_days si existe)
            const paymentDate = new Date(lastPayment.date);
            const daysToAdd = lastPayment.active_days || 30; // Default a 30 si no hay info
            const expirationDate = new Date(paymentDate);
            expirationDate.setDate(expirationDate.getDate() + daysToAdd);
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
                    ? `⚠️ Tu membresía vence HOY - ${config.name}`
                    : `⏳ Recordatorio: Tu membresía vence el ${dateStr}`;

                const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h1>Hola, ${client.first_name} 👋</h1>
                    <p>Esperamos que estés disfrutando tus entrenamientos en <strong>${config.name}</strong>.</p>
                    <p>Este es un recordatorio amigable de que tu membresía vence el: <strong>${dateStr}</strong>.</p>
                    <p>¡Te esperamos para renovar y seguir cumpliendo tus metas!</p>
                    <br/>
                    <p>Saludos,<br/>El equipo de ${config.name}</p>
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
            processed: clients.length,
            sent: results.length,
            details: results
        });

    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
