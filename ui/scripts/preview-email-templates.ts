/**
 * Script para generar previews de los templates de email
 * Uso: npx tsx scripts/preview-email-templates.ts
 */

import fs from 'fs';
import path from 'path';
import {
    reminderSoonTemplate,
    dueTodayTemplate,
    welcomeTemplate,
    createEmailConfigFromTenant,
    type EmailTemplateConfig
} from '../src/lib/email-templates';

const OUTPUT_DIR = path.join(process.cwd(), 'email-previews');

// Crear directorio de output si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configuración de ejemplo
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

// Template 1: Recordatorio próximo (3 días)
const reminder3Days = reminderSoonTemplate(emailConfig, {
    clientName: 'María',
    expirationDate: '15/02/2026',
    daysRemaining: 3,
    renewUrl: 'https://gymazul.com/renovar'
});

fs.writeFileSync(
    path.join(OUTPUT_DIR, '1-reminder-3-days.html'),
    reminder3Days
);
console.log('✅ Preview generado: 1-reminder-3-days.html');

// Template 2: Recordatorio próximo (1 día)
const reminder1Day = reminderSoonTemplate(emailConfig, {
    clientName: 'Carlos',
    expirationDate: '10/02/2026',
    daysRemaining: 1,
    renewUrl: 'https://gymazul.com/renovar'
});

fs.writeFileSync(
    path.join(OUTPUT_DIR, '2-reminder-1-day.html'),
    reminder1Day
);
console.log('✅ Preview generado: 2-reminder-1-day.html');

// Template 3: Vence HOY
const dueToday = dueTodayTemplate(emailConfig, {
    clientName: 'Ana',
    expirationDate: '05/02/2026',
    renewUrl: 'https://gymazul.com/renovar'
});

fs.writeFileSync(
    path.join(OUTPUT_DIR, '3-due-today.html'),
    dueToday
);
console.log('✅ Preview generado: 3-due-today.html');

// Template 4: Bienvenida
const welcome = welcomeTemplate(emailConfig, {
    clientName: 'Pedro',
    membershipType: 'Plan Mensual Premium',
    startDate: '01/02/2026'
});

fs.writeFileSync(
    path.join(OUTPUT_DIR, '4-welcome.html'),
    welcome
);
console.log('✅ Preview generado: 4-welcome.html');

// Crear index.html para navegar entre previews
const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Templates Preview - Gym Azul</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f4f7fa;
    }
    h1 {
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .card h3 {
      margin: 0 0 8px 0;
      color: #007bff;
    }
    .card p {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #666;
    }
    .card a {
      display: inline-block;
      padding: 10px 20px;
      background: linear-gradient(135deg, #007bff 0%, #00d4ff 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .card a:hover {
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #e3f2fd;
      color: #007bff;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <h1>📧 Email Templates Preview</h1>
  <p>Gym Azul - Sistema de emails profesionales</p>
  
  <div class="grid">
    <div class="card">
      <span class="badge">Recordatorio</span>
      <h3>Vence en 3 días</h3>
      <p>Template para recordatorio con 3 días de anticipación</p>
      <a href="1-reminder-3-days.html" target="_blank">Ver Preview</a>
    </div>
    
    <div class="card">
      <span class="badge">Recordatorio</span>
      <h3>Vence en 1 día</h3>
      <p>Template para recordatorio con 1 día de anticipación</p>
      <a href="2-reminder-1-day.html" target="_blank">Ver Preview</a>
    </div>
    
    <div class="card">
      <span class="badge">Urgente</span>
      <h3>Vence HOY</h3>
      <p>Template para vencimiento el mismo día</p>
      <a href="3-due-today.html" target="_blank">Ver Preview</a>
    </div>
    
    <div class="card">
      <span class="badge">Onboarding</span>
      <h3>Bienvenida</h3>
      <p>Template para nuevos miembros del gym</p>
      <a href="4-welcome.html" target="_blank">Ver Preview</a>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
console.log('✅ Index generado: index.html');

console.log('\n🎉 Todos los previews generados exitosamente!');
console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
console.log('\n💡 Abre index.html en tu navegador para ver los templates');
