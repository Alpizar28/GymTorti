/**
 * Script para enviar un email de prueba real
 * Uso: npx tsx scripts/test-send-email.ts
 * 
 * NOTA: Requiere que RESEND_API_KEY esté configurado en .env.local
 */

import { Resend } from 'resend';
import {
    reminderSoonTemplate,
    dueTodayTemplate,
    welcomeTemplate,
    type EmailTemplateConfig
} from '../src/lib/email-templates';

// Verificar que existe RESEND_API_KEY
if (!process.env.RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY no está configurado en .env.local');
    console.log('\n💡 Agrega tu API key:');
    console.log('   RESEND_API_KEY=re_xxxxxxxxxxxxx');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración del gym
const emailConfig: EmailTemplateConfig = {
    gymName: 'Gym Azul Demo',
    gymTagline: 'Transforma tu vida',
    primaryColor: '#007bff',
    secondaryColor: '#00d4ff',
    logoUrl: 'https://via.placeholder.com/180x60/007bff/ffffff?text=GYM+AZUL',
    websiteUrl: 'https://gymazul.com',
    socialMedia: {
        instagram: 'https://instagram.com/gymazul',
        facebook: 'https://facebook.com/gymazul',
        whatsapp: 'https://wa.me/50612345678'
    }
};

// EMAIL DE DESTINO (cámbialo por el tuyo)
const TEST_EMAIL = process.env.TEST_EMAIL || 'jokemtech@gmail.com';

async function sendTestEmail() {
    console.log('📧 Enviando emails de prueba...\n');

    try {
        // 1. Recordatorio (3 días)
        console.log('1️⃣ Enviando: Recordatorio 3 días...');
        const html1 = reminderSoonTemplate(emailConfig, {
            clientName: 'María (Test)',
            expirationDate: '15/02/2026',
            daysRemaining: 3,
        });

        const result1 = await resend.emails.send({
            from: 'Gym Azul <onboarding@resend.dev>',
            to: [TEST_EMAIL],
            subject: '⏳ [TEST] Tu membresía vence en 3 días - Gym Azul',
            html: html1,
        });

        console.log(`   ✅ Enviado! ID: ${result1.data?.id}`);

        // 2. Vence HOY
        console.log('\n2️⃣ Enviando: Vence HOY...');
        const html2 = dueTodayTemplate(emailConfig, {
            clientName: 'Carlos (Test)',
            expirationDate: new Date().toLocaleDateString('es-CR'),
        });

        const result2 = await resend.emails.send({
            from: 'Gym Azul <onboarding@resend.dev>',
            to: [TEST_EMAIL],
            subject: '⚠️ [TEST] Tu membresía vence HOY - Gym Azul',
            html: html2,
        });

        console.log(`   ✅ Enviado! ID: ${result2.data?.id}`);

        // 3. Bienvenida
        console.log('\n3️⃣ Enviando: Bienvenida...');
        const html3 = welcomeTemplate(emailConfig, {
            clientName: 'Ana (Test)',
            membershipType: 'Plan Mensual',
            startDate: new Date().toLocaleDateString('es-CR'),
        });

        const result3 = await resend.emails.send({
            from: 'Gym Azul <onboarding@resend.dev>',
            to: [TEST_EMAIL],
            subject: '🎉 [TEST] ¡Bienvenido a Gym Azul!',
            html: html3,
        });

        console.log(`   ✅ Enviado! ID: ${result3.data?.id}`);

        console.log('\n🎉 ¡Todos los emails enviados exitosamente!');
        console.log(`📬 Revisa tu bandeja de entrada: ${TEST_EMAIL}`);
        console.log('\n💡 Tip: Puede tardar unos segundos en llegar. Revisa spam si no lo ves.');

    } catch (error) {
        console.error('\n❌ Error al enviar emails:', error);
        if (error instanceof Error) {
            console.error('   Mensaje:', error.message);
        }
        process.exit(1);
    }
}

sendTestEmail();
