import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { sendMail } from '../../config/mail.js'
import { escapeHtml } from '../../utils/html.js'
import { BadRequestError } from '../../utils/errors.js'

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(100),
  email: z.string().trim().email('E-mail inválido'),
  orderId: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres').max(2000),
  // Campo invisível no formulário: robôs costumam preencher
  website: z.string().optional(),
})

export async function contactRoutes(app: FastifyInstance) {
  app.post('/', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } }, async (request, reply) => {
    const data = ContactSchema.parse(request.body)
    if (data.website) {
      // Honeypot: responde como sucesso sem enviar nada
      return reply.send({ success: true })
    }

    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    const to = settings?.contactEmail
    if (!to) {
      throw new BadRequestError('O atendimento por formulário ainda não foi configurado pela loja.')
    }

    const sent = await sendMail({
      to,
      replyTo: data.email,
      subject: `[Contato] ${data.name}${data.orderId ? ` — pedido ${data.orderId}` : ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Nova mensagem pelo site</h2>
          <p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
          ${data.orderId ? `<p><strong>Pedido:</strong> ${escapeHtml(data.orderId)}</p>` : ''}
          <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        </div>
      `,
    })

    if (!sent && env.NODE_ENV === 'production') {
      throw new BadRequestError('Não foi possível enviar a mensagem agora. Tente novamente em instantes.')
    }

    return reply.send({ success: true })
  })
}
