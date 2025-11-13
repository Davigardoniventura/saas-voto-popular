import nodemailer from "nodemailer";
import { ENV } from "../_core/env";

// Verificar se as credenciais de email estão configuradas
function isEmailConfigured(): boolean {
  return !!(ENV.emailUser && ENV.emailPassword);
}

// Configurar transporter do nodemailer com SMTP Brevo
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!isEmailConfigured()) {
      console.warn(
        "[Email] ⚠️  Configuração de email incompleta.\n" +
        "Defina EMAIL_USER e EMAIL_PASSWORD para habilitar envio de emails."
      );
    }
    
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: ENV.emailUser || "",
        pass: ENV.emailPassword || "",
      },
    });
  }
  return transporter;
}

/**
 * Enviar email de reclamação para o suporte
 */
export async function sendComplaintEmail(
  complaint: string,
  userEmail?: string,
  context?: string
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error("[Email] ❌ Não é possível enviar email: configuração incompleta");
    return false;
  }
  
  try {
    const transporter = getTransporter();
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; border: 1px solid #ddd; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; }
            .label { font-weight: bold; color: #3b82f6; }
            .complaint-text { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 Nova Reclamação Recebida - Voto Popular</h2>
            </div>
            <div class="content">
              <p>Uma nova reclamação foi enviada através da plataforma Voto Popular.</p>
              
              <div style="margin: 20px 0;">
                <p><span class="label">Data:</span> ${new Date().toLocaleString("pt-BR")}</p>
                <p><span class="label">Contexto:</span> ${context || "Não especificado"}</p>
                <p><span class="label">Email do Usuário:</span> ${userEmail || "Não fornecido"}</p>
              </div>
              
              <p><span class="label">Mensagem da Reclamação:</span></p>
              <div class="complaint-text">
                ${complaint.replace(/\n/g, "<br>")}
              </div>
              
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <strong>Ação Recomendada:</strong> Revise esta reclamação e entre em contato com o usuário se necessário.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Voto Popular - Plataforma Legislativa</p>
              <p>Este é um email automático. Não responda diretamente.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: ENV.emailUser,
      to: ENV.superAdminEmail, // Enviar para o Super Admin
      subject: `🚨 Nova Reclamação - Voto Popular [${context || "Geral"}]`,
      html: htmlContent,
      replyTo: userEmail || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Email] Reclamação enviada com sucesso:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar reclamação:", error);
    return false;
  }
}

/**
 * Enviar email de confirmação para o usuário
 */
export async function sendComplaintConfirmationEmail(userEmail: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error("[Email] ❌ Não é possível enviar email: configuração incompleta");
    return false;
  }
  
  try {
    const transporter = getTransporter();
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #10b981; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; border: 1px solid #ddd; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Reclamação Recebida com Sucesso</h2>
            </div>
            <div class="content">
              <p>Obrigado por enviar sua reclamação para a plataforma Voto Popular!</p>
              
              <p>Recebemos sua mensagem e nossa equipe de suporte analisará em breve. Você receberá uma resposta por email assim que possível.</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p><strong>Número de Protocolo:</strong> VP-${Date.now()}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
              </div>
              
              <p style="margin-top: 20px;">Se tiver dúvidas adicionais, entre em contato conosco através da plataforma ou envie um email para <strong>contato@votopopular.com.br</strong>.</p>
              
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                Agradecemos por ajudar a melhorar a plataforma Voto Popular!
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Voto Popular - Plataforma Legislativa</p>
              <p>Este é um email automático. Não responda diretamente.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: ENV.emailUser,
      to: userEmail,
      subject: "✅ Reclamação Recebida - Voto Popular",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Email] Confirmação enviada para o usuário:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar confirmação:", error);
    return false;
  }
}

/**
 * Verificar se o transporter está configurado corretamente
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("[Email] ⚠️  Configuração de email não está completa");
    return false;
  }
  
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[Email] Configuração de email verificada com sucesso");
    return true;
  } catch (error) {
    console.error("[Email] Erro na configuração de email:", error);
    return false;
  }
}
