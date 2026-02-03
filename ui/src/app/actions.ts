"use server";

import { Resend } from "resend";
import { appConfig } from "@/config/app.config";

// Initialize Resend with the API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

interface PaymentReceiptProps {
  toEmail: string;
  clientName: string;
  amount: number;
  date: string;
  concept: string;
  reference?: string;
  currencySymbol?: string;
}

/**
 * Sends a transactional payment receipt email using Resend.
 * @param data Payment details
 */
export async function sendPaymentReceipt(data: PaymentReceiptProps) {
  if (!appConfig.email.enabled) {
    console.log("🚫 Email sending is disabled in tenant.setup.json");
    return { success: false, message: "Email disabled" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing in .env");
    return { success: false, message: "Server misconfiguration: No API Key" };
  }

  const { toEmail, clientName, amount, date, concept, reference, currencySymbol = "$" } = data;
  const gymName = appConfig.ui.gymName;
  const primaryColor = appConfig.ui.theme.primary.solid;

  // Premium HTML Template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo de Pago</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: ${primaryColor}; padding: 32px 20px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 18px; margin-bottom: 24px; color: #4b5563; }
        .success-badge { text-align: center; margin-bottom: 32px; }
        .success-icon { font-size: 48px; margin-bottom: 8px; display: block; }
        .success-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .receipt-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
        .receipt-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
        .receipt-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 1px dashed #d1d5db; font-weight: 700; font-size: 18px; color: ${primaryColor}; }
        .receipt-label { color: #6b7280; }
        .receipt-value { color: #111827; font-weight: 600; text-align: right; }
        .footer { background-color: #1f2937; padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
        .footer p { margin: 4px 0; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${gymName}</h1>
        </div>
        
        <div class="content">
          <div class="success-badge">
            <span class="success-icon">✅</span>
            <p class="success-title">¡Pago Confirmado!</p>
          </div>

          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          
          <p style="margin-bottom: 24px; line-height: 1.6;">
            Gracias por tu pago. Tu membresía ha sido actualizada correctamente. 
            ¡Sigue entrenando duro para alcanzar tus metas! 🚀
          </p>

          <div class="receipt-box">
             <div class="receipt-row">
              <span class="receipt-label">Concepto</span>
              <span class="receipt-value">${concept}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Fecha</span>
              <span class="receipt-value">${date}</span>
            </div>
            ${reference ? `
            <div class="receipt-row">
              <span class="receipt-label">Referencia</span>
              <span class="receipt-value" style="font-family: monospace;">${reference}</span>
            </div>` : ''}
            <div class="receipt-row">
              <span class="receipt-label">Total</span>
              <span class="receipt-value">${currencySymbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount)}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">¿Tienes alguna duda sobre tu plan?</p>
            <a href="mailto:${appConfig.email.fromEmail}" class="button">Contactar Soporte</a>
          </div>
        </div>

        <div class="footer">
          <p>${gymName}</p>
          <p>“El dolor es temporal, el orgullo es para siempre”</p>
          <p style="margin-top: 16px; font-size: 11px;">Este es un correo automático, por favor no respondas directamente.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `${appConfig.email.fromName} <${appConfig.email.fromEmail}>`,
      to: [toEmail],
      subject: `✅ Recibo de Pago - ${gymName}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email via Resend:", error);
      return { success: false, error };
    }

    console.log("✅ Email sent successfully:", emailData);
    return { success: true, data: emailData };

  } catch (err) {
    console.error("Unexpected error sending email:", err);
    return { success: false, error: err };
  }
}
