import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
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

  async enviarInvitacion(usuario: { email: string; primerNombre: string; tokenInvitacion: string }): Promise<void> {
    const url = `${this.frontendUrl()}/completar-perfil?token=${usuario.tokenInvitacion}`;
    await this.transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      usuario.email,
      subject: 'Bienvenido a SOFITUL — Activá tu cuenta',
      html: `
        <h2>Hola ${usuario.primerNombre},</h2>
        <p>Fuiste invitado/a al sistema SOFITUL.</p>
        <p>Hacé clic en el siguiente enlace para activar tu cuenta:</p>
        <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Activar cuenta
        </a>
        <p style="color:#666;font-size:12px;margin-top:16px;">Este enlace expira en 7 días.</p>
      `,
    });
  }

  async enviarResetPassword(usuario: { email: string; primerNombre?: string; tokenInvitacion: string }): Promise<void> {
    const url = `${this.frontendUrl()}/recuperar-password?token=${usuario.tokenInvitacion}`;
    await this.transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      usuario.email,
      subject: 'SOFITUL — Recuperar contraseña',
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Restablecer contraseña
        </a>
        <p style="color:#666;font-size:12px;margin-top:16px;">Este enlace expira en 2 horas.</p>
      `,
    });
  }

  async enviarRecibo(destinatario: string, asunto: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      destinatario,
      subject: asunto,
      html,
    });
  }
}
