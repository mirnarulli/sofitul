import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// ── Plantilla base ─────────────────────────────────────────────────────────────
function layout(contenido: string, pie?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 40px;">
          <p style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">SOFITUL</p>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px;">Sistema de Operaciones Financieras</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;color:#1e293b;font-size:15px;line-height:1.6;">
          ${contenido}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">${pie ?? 'Este mensaje fue generado automáticamente. No respondas a este correo.'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btnPrimario(url: string, texto: string): string {
  return `<a href="${url}" style="display:inline-block;margin:20px 0;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">${texto}</a>`;
}

// ── Service ────────────────────────────────────────────────────────────────────
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5174';
  }

  // ── Envío con retry (máx 2 reintentos, backoff 2s → 4s) ──────────────────
  private async send(opts: nodemailer.SendMailOptions, intento = 1): Promise<void> {
    try {
      await this.transporter.sendMail({ from: process.env.SMTP_FROM, ...opts });
      this.logger.log(`✉  Email enviado a ${opts.to} — "${opts.subject}"`);
    } catch (err) {
      if (intento < 3) {
        const delay = intento * 2000;
        this.logger.warn(`Email a ${opts.to} falló (intento ${intento}/3). Reintentando en ${delay / 1000}s…`);
        await new Promise(r => setTimeout(r, delay));
        return this.send(opts, intento + 1);
      }
      // 3 intentos fallidos — registrar y NO relanzar para no bloquear la operación principal
      this.logger.error(`✖ Email a ${opts.to} falló tras 3 intentos: ${(err as Error).message}`);
    }
  }

  // ── Plantillas ────────────────────────────────────────────────────────────
  async enviarInvitacion(usuario: { email: string; primerNombre: string; tokenInvitacion: string }): Promise<void> {
    const url = `${this.frontendUrl()}/completar-perfil?token=${usuario.tokenInvitacion}`;
    await this.send({
      to:      usuario.email,
      subject: 'Bienvenido a SOFITUL — Activá tu cuenta',
      html: layout(`
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;">¡Hola, ${usuario.primerNombre}!</p>
        <p>Fuiste invitado/a al sistema <strong>SOFITUL</strong>.</p>
        <p>Hacé clic en el botón para activar tu cuenta y establecer tu contraseña:</p>
        ${btnPrimario(url, 'Activar mi cuenta')}
        <p style="color:#64748b;font-size:13px;">Si no podés hacer clic en el botón, copiá este enlace en tu navegador:<br>
          <a href="${url}" style="color:#2563eb;word-break:break-all;">${url}</a>
        </p>
      `, 'Este enlace expira en 7 días.'),
    });
  }

  async enviarResetPassword(usuario: { email: string; primerNombre?: string; tokenInvitacion: string }): Promise<void> {
    const url = `${this.frontendUrl()}/recuperar-password?token=${usuario.tokenInvitacion}`;
    const nombre = usuario.primerNombre ? `Hola, ${usuario.primerNombre}. ` : '';
    await this.send({
      to:      usuario.email,
      subject: 'SOFITUL — Recuperar contraseña',
      html: layout(`
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;">Recuperar contraseña</p>
        <p>${nombre}Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>Si fuiste vos quien la solicitó, hacé clic en el botón:</p>
        ${btnPrimario(url, 'Restablecer contraseña')}
        <p style="color:#64748b;font-size:13px;">Si no solicitaste este cambio, podés ignorar este mensaje. Tu contraseña no será modificada.</p>
      `, 'Este enlace expira en 2 horas.'),
    });
  }

  async enviarRecibo(destinatario: string, asunto: string, html: string): Promise<void> {
    await this.send({ to: destinatario, subject: asunto, html });
  }
}
