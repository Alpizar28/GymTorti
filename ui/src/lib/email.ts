import { Resend } from 'resend';

// Crear cliente de Resend solo si existe la key, para evitar errores en build time
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    fromEmail?: string;
}

export async function sendEmail({
    to,
    subject,
    html,
    fromName = 'Gimnasio',
    fromEmail = 'onboarding@resend.dev' // Default de Resend para pruebas si no se tiene dominio verificado
}: SendEmailParams) {
    if (!process.env.RESEND_API_KEY || !resend) {
        console.warn("⚠️ RESEND_API_KEY no configurada. Email NO enviado:", { to, subject });
        return { success: false, error: 'API Key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("Error enviando email:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Excepción enviando email:", err);
        return { success: false, error: err };
    }
}
