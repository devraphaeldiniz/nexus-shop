import nodemailer from 'nodemailer'
import { env } from './env.js'

/** Sem SMTP_HOST (ex.: vitrine de portfólio) os e-mails são só registrados no log. */
export const mailEnabled = !!env.SMTP_HOST

export const mailTransporter = mailEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null

export async function sendMail(options: {
  to: string
  subject: string
  html: string
  replyTo?: string
}) {
  // Testes automatizados não enviam e-mail
  if (env.NODE_ENV === 'test') return null
  if (!mailTransporter) {
    console.info(`E-mail não enviado (SMTP não configurado): "${options.subject}" para ${options.to}`)
    return null
  }

  try {
    const info = await mailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    })
    return info
  } catch (error) {
    // Uma linha só: em desenvolvimento o SMTP de exemplo sempre falha
    console.error(`Falha ao enviar e-mail para ${options.to}:`, error instanceof Error ? error.message : error)
    return null
  }
}
