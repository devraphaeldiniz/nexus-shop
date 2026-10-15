import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'

const UpdateSettingsSchema = z.object({
  storeName: z.string().min(1).default('Nexus Shop'),
  legalName: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  supportWhatsapp: z.string().optional().nullable(),
  freeShippingThreshold: z.number().nonnegative().default(0),

  stripeEnabled: z.boolean().default(false),
  stripePublishableKey: z.string().optional().nullable(),
  stripeSecretKey: z.string().optional().nullable(),

  mercadoPagoEnabled: z.boolean().default(false),
  mercadoPagoPublicKey: z.string().optional().nullable(),
  mercadoPagoAccessToken: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
})

export async function settingsRoutes(app: FastifyInstance) {
  // Obter configurações públicas da loja (para o checkout e rodapé)
  app.get('/public', async (_request, reply) => {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: 'default' },
      })
    }

    return reply.send({
      storeName: settings.storeName,
      legalName: settings.legalName,
      documentNumber: settings.documentNumber,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      supportWhatsapp: settings.supportWhatsapp,
      freeShippingThreshold: Number(settings.freeShippingThreshold),
      paymentGateways: {
        stripe: {
          enabled: settings.stripeEnabled,
          publishableKey: settings.stripePublishableKey || null,
        },
        mercadoPago: {
          enabled: settings.mercadoPagoEnabled,
          publicKey: settings.mercadoPagoPublicKey || null,
        },
        pixKey: settings.pixKey || null,
      },
    })
  })

  // Obter configurações completas (Admin)
  app.get(
    '/',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (_request, reply) => {
      let settings = await prisma.storeSettings.findUnique({
        where: { id: 'default' },
      })

      if (!settings) {
        settings = await prisma.storeSettings.create({
          data: { id: 'default' },
        })
      }

      return reply.send({ settings })
    }
  )

  // Atualizar configurações da loja e chaves de API (Admin)
  app.put(
    '/',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const data = UpdateSettingsSchema.parse(request.body)

      const settings = await prisma.storeSettings.upsert({
        where: { id: 'default' },
        update: {
          ...data,
          legalName: data.legalName || null,
          documentNumber: data.documentNumber || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          supportWhatsapp: data.supportWhatsapp || null,
          stripePublishableKey: data.stripePublishableKey || null,
          stripeSecretKey: data.stripeSecretKey || null,
          mercadoPagoPublicKey: data.mercadoPagoPublicKey || null,
          mercadoPagoAccessToken: data.mercadoPagoAccessToken || null,
          pixKey: data.pixKey || null,
        },
        create: {
          id: 'default',
          ...data,
          legalName: data.legalName || null,
          documentNumber: data.documentNumber || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          supportWhatsapp: data.supportWhatsapp || null,
          stripePublishableKey: data.stripePublishableKey || null,
          stripeSecretKey: data.stripeSecretKey || null,
          mercadoPagoPublicKey: data.mercadoPagoPublicKey || null,
          mercadoPagoAccessToken: data.mercadoPagoAccessToken || null,
          pixKey: data.pixKey || null,
        },
      })

      return reply.send({
        success: true,
        message: 'Configurações da loja salvas com sucesso',
        settings,
      })
    }
  )
}
