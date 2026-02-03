/**
 * Sistema de Templates de Email - JokemGym
 * 
 * Templates profesionales y responsivos con branding personalizado por tenant
 */

export interface EmailTemplateConfig {
    gymName: string;
    gymTagline?: string;
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    websiteUrl?: string;
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
    };
}

/**
 * Estilos base para todos los emails
 */
const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f4f7fa;
    color: #333333;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    padding: 40px 30px;
    text-align: center;
    background: linear-gradient(135deg, {primaryColor} 0%, {secondaryColor} 100%);
  }
  .logo {
    max-width: 180px;
    height: auto;
    margin-bottom: 20px;
  }
  .header-title {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .header-tagline {
    color: rgba(255,255,255,0.9);
    font-size: 14px;
    margin: 10px 0 0 0;
  }
  .content {
    padding: 40px 30px;
  }
  .greeting {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 20px 0;
  }
  .message {
    font-size: 16px;
    line-height: 1.6;
    color: #555555;
    margin: 0 0 20px 0;
  }
  .highlight-box {
    background: linear-gradient(135deg, rgba({primaryColorRGB}, 0.1) 0%, rgba({secondaryColorRGB}, 0.1) 100%);
    border-left: 4px solid {primaryColor};
    padding: 20px;
    margin: 30px 0;
    border-radius: 8px;
  }
  .highlight-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: {primaryColor};
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  .highlight-value {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
  }
  .cta-button {
    display: inline-block;
    padding: 16px 40px;
    background: linear-gradient(135deg, {primaryColor} 0%, {secondaryColor} 100%);
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
    box-shadow: 0 4px 15px rgba({primaryColorRGB}, 0.3);
    transition: transform 0.2s;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #e9ecef;
  }
  .footer-text {
    font-size: 14px;
    color: #6c757d;
    margin: 5px 0;
  }
  .social-links {
    margin: 20px 0;
  }
  .social-link {
    display: inline-block;
    margin: 0 10px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #e9ecef 50%, transparent 100%);
    margin: 30px 0;
  }
  @media only screen and (max-width: 600px) {
    .content {
      padding: 30px 20px;
    }
    .header {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 20px;
    }
    .message {
      font-size: 15px;
    }
  }
`;

/**
 * Convierte color hex a RGB
 */
function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0,0,0';
    return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

/**
 * Reemplaza placeholders en el template
 */
function replacePlaceholders(template: string, config: EmailTemplateConfig): string {
    const primaryRgb = hexToRgb(config.primaryColor);
    const secondaryRgb = hexToRgb(config.secondaryColor || config.primaryColor);

    return template
        .replace(/{primaryColor}/g, config.primaryColor)
        .replace(/{secondaryColor}/g, config.secondaryColor || config.primaryColor)
        .replace(/{primaryColorRGB}/g, primaryRgb)
        .replace(/{secondaryColorRGB}/g, secondaryRgb)
        .replace(/{gymName}/g, config.gymName)
        .replace(/{gymTagline}/g, config.gymTagline || '')
        .replace(/{logoUrl}/g, config.logoUrl || '')
        .replace(/{websiteUrl}/g, config.websiteUrl || '#');
}

/**
 * Template base con header y footer
 */
function createBaseTemplate(config: EmailTemplateConfig, content: string): string {
    const styles = replacePlaceholders(baseStyles, config);

    const logoSection = config.logoUrl
        ? `<img src="${config.logoUrl}" alt="${config.gymName}" class="logo" />`
        : '';

    const taglineSection = config.gymTagline
        ? `<p class="header-tagline">${config.gymTagline}</p>`
        : '';

    const socialLinks = [];
    if (config.socialMedia?.instagram) {
        socialLinks.push(`<a href="${config.socialMedia.instagram}" class="social-link">📷 Instagram</a>`);
    }
    if (config.socialMedia?.facebook) {
        socialLinks.push(`<a href="${config.socialMedia.facebook}" class="social-link">👍 Facebook</a>`);
    }
    if (config.socialMedia?.whatsapp) {
        socialLinks.push(`<a href="${config.socialMedia.whatsapp}" class="social-link">💬 WhatsApp</a>`);
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.gymName}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      ${logoSection}
      <h1 class="header-title">${config.gymName}</h1>
      ${taglineSection}
    </div>
    
    <!-- Content -->
    <div class="content">
      ${content}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      ${socialLinks.length > 0 ? `<div class="social-links">${socialLinks.join(' ')}</div>` : ''}
      <p class="footer-text">© ${new Date().getFullYear()} ${config.gymName}</p>
      <p class="footer-text">Recibiste este correo porque eres parte de nuestra comunidad</p>
      ${config.websiteUrl && config.websiteUrl !== '#' ? `<p class="footer-text"><a href="${config.websiteUrl}" style="color: ${config.primaryColor};">Visita nuestro sitio web</a></p>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template: Recordatorio de vencimiento próximo
 */
export function reminderSoonTemplate(
    config: EmailTemplateConfig,
    data: {
        clientName: string;
        expirationDate: string;
        daysRemaining: number;
        renewUrl?: string;
    }
): string {
    const content = `
    <h2 class="greeting">¡Hola, ${data.clientName}! 👋</h2>
    
    <p class="message">
      Esperamos que estés disfrutando tus entrenamientos y alcanzando tus metas. 💪
    </p>
    
    <p class="message">
      Te escribimos para recordarte que tu membresía está próxima a vencer:
    </p>
    
    <div class="highlight-box">
      <p class="highlight-label">Fecha de Vencimiento</p>
      <p class="highlight-value">${data.expirationDate}</p>
      <p class="highlight-label" style="margin-top: 15px;">Días Restantes</p>
      <p class="highlight-value" style="color: ${config.primaryColor};">${data.daysRemaining} ${data.daysRemaining === 1 ? 'día' : 'días'}</p>
    </div>
    
    <p class="message">
      ¡No dejes que nada interrumpa tu progreso! Renueva hoy y continúa transformando tu vida.
    </p>
    
    ${data.renewUrl ? `
      <div style="text-align: center;">
        <a href="${data.renewUrl}" class="cta-button">
          Renovar Membresía
        </a>
      </div>
    ` : ''}
    
    <div class="divider"></div>
    
    <p class="message" style="font-size: 14px; color: #6c757d;">
¿Tienes preguntas? Estamos aquí para ayudarte. Visítanos en el gym o contáctanos directamente.
    </p>
    
    <p class="message" style="font-weight: 600; color: ${config.primaryColor};">
      ¡Nos vemos en el gym! 🏋️
    </p>
  `;

    return createBaseTemplate(config, content);
}

/**
 * Template: Vencimiento HOY
 */
export function dueTodayTemplate(
    config: EmailTemplateConfig,
    data: {
        clientName: string;
        expirationDate: string;
        renewUrl?: string;
    }
): string {
    const content = `
    <h2 class="greeting">⚠️ ¡Atención, ${data.clientName}!</h2>
    
    <p class="message" style="font-size: 18px; font-weight: 600; color: #d9534f;">
      Tu membresía vence <strong>HOY</strong> - ${data.expirationDate}
    </p>
    
    <p class="message">
      No queremos que pierdas acceso a todas las facilidades y clases que tanto disfrutas.
    </p>
    
    <div class="highlight-box" style="border-color: #d9534f; background: linear-gradient(135deg, rgba(217,83,79,0.1) 0%, rgba(217,83,79,0.05) 100%);">
      <p class="highlight-label" style="color: #d9534f;">⏰ ÚLTIMO DÍA</p>
      <p class="highlight-value" style="color: #d9534f;">Renueva Hoy</p>
      <p class="message" style="margin-top: 15px; margin-bottom: 0;">
        Evita interrupciones en tu rutina y mantén el impulso que has construido.
      </p>
    </div>
    
    ${data.renewUrl ? `
      <div style="text-align: center;">
        <a href="${data.renewUrl}" class="cta-button" style="background: linear-gradient(135deg, #d9534f 0%, #c9302c 100%); box-shadow: 0 4px 15px rgba(217,83,79,0.3);">
          Renovar Ahora
        </a>
      </div>
    ` : ''}
    
    <p class="message" style="text-align: center; font-size: 14px; color: #6c757d; margin-top: 30px;">
      También puedes renovar directamente en el gym. ¡Te esperamos!
    </p>
    
    <p class="message" style="font-weight: 600; text-align: center; color: ${config.primaryColor};">
      🏋️ ¡Sigue alcanzando tus metas con nosotros!
    </p>
  `;

    return createBaseTemplate(config, content);
}

/**
 * Template: Bienvenida (opcional, para nuevos miembros)
 */
export function welcomeTemplate(
    config: EmailTemplateConfig,
    data: {
        clientName: string;
        membershipType?: string;
        startDate?: string;
    }
): string {
    const content = `
    <h2 class="greeting">¡Bienvenido a ${config.gymName}, ${data.clientName}! 🎉</h2>
    
    <p class="message" style="font-size: 18px;">
      ¡Estamos emocionados de tenerte como parte de nuestra familia fitness!
    </p>
    
    <p class="message">
      Tu viaje hacia una vida más saludable y fuerte comienza hoy. Aquí encontrarás:
    </p>
    
    <div class="highlight-box">
      <p class="message" style="margin: 0; line-height: 1.8;">
        ✅ Equipamiento de última generación<br/>
        ✅ Instructores certificados y apasionados<br/>
        ✅ Clases grupales variadas<br/>
        ✅ Una comunidad motivadora<br/>
        ✅ Horarios flexibles
      </p>
    </div>
    
    ${data.membershipType ? `
      <p class="message" style="text-align: center;">
        <strong>Tu Plan:</strong> ${data.membershipType}<br/>
        ${data.startDate ? `<strong>Inicio:</strong> ${data.startDate}` : ''}
      </p>
    ` : ''}
    
    <p class="message">
      Recuerda que nuestro equipo está aquí para apoyarte en cada paso del camino. 
      No dudes en preguntar si necesitas ayuda con los equipos o consejos de entrenamiento.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p class="message" style="font-size: 24px; margin: 0;">💪</p>
      <p class="message" style="font-weight: 600; color: ${config.primaryColor}; margin: 10px 0;">
        ¡Nos vemos en el gym!
      </p>
    </div>
  `;

    return createBaseTemplate(config, content);
}

/**
 * Helper para crear configuración desde tenant config
 */
export function createEmailConfigFromTenant(tenantConfig: any): EmailTemplateConfig {
    return {
        gymName: tenantConfig.branding?.gymName || tenantConfig.tenant?.displayName || 'Gym',
        gymTagline: tenantConfig.branding?.gymTagline,
        primaryColor: tenantConfig.branding?.colors?.primary || '#007bff',
        secondaryColor: tenantConfig.branding?.colors?.secondary,
        logoUrl: tenantConfig.branding?.logoPath,
        websiteUrl: tenantConfig.tenant?.website,
        socialMedia: {
            instagram: tenantConfig.branding?.socialMedia?.instagram,
            facebook: tenantConfig.branding?.socialMedia?.facebook,
            whatsapp: tenantConfig.branding?.socialMedia?.whatsapp,
        },
    };
}
