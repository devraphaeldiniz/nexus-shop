import nodemailer from 'nodemailer'
import { env } from './env.js'

export const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

export async function sendMail(options: {
  to: string
  subject: string
  html: string
}) {
  try {
    const info = await mailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return info
  } catch (error) {
    console.error('Falha ao enviar e-mail:', error)
    return null
  }
}
