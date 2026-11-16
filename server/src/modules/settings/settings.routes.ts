import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { StoreSettings } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { encryptSecret, isMaskedValue, maskSecret } from '../../utils/secret-box.js'

const nullableText = z.string().trim().optional().nullable()

const UpdateSettingsSchema = z.object({
  storeName: z.string().trim().min(1).default('Nexus Shop'),
  legalName: nullableText,
  documentNumber: nullableText,
  contactEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
  contactPhone: nullableText,
  supportWhatsapp: nullableText,
  freeShippingThreshold: z.number().nonnegative().default(0),

  stripeEnabled: z.boolean().default(false),
  stripePublishableKey: nullableText,
  // Segredos: ausente ou máscara ("••••1234") = mantém o salvo; "" ou null = apaga
  stripeSecretKey: nullableText,

  mercadoPagoEnabled: z.boolean().default(false),
  mercadoPagoPublicKey: nullableText,
  mercadoPagoAccessToken: nullableText,
  pixKey: nullableText,
})

const SECRET_FIELDS = ['stripeSecretKey', 'mercadoPagoAccessToken'] as const

async function getOrCreateSettings() {
  return (
    (await prisma.storeSettings.findUnique({ where: { id: 'default' } })) ??
    (await prisma.storeSettings.create({ data: { id: 'default' } }))
  )
}

/** Versão para o painel: segredos nunca saem do servidor, só mascarados. */
function toAdminView(settings: StoreSettings) {
  return {
    ...settings,
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    stripeSecretKey: maskSecret(settings.stripeSecretKey),
    mercadoPagoAccessToken: maskSecret(settings.mercadoPagoAccessToken),
  }
}

/** Decide o que gravar em cada campo secreto. undefined = não altera. */
function resolveSecret(value: string | null | undefined): string | null | undefined {
  if (value === undefined || isMaskedValue(value)) return undefined
  if (value === null || value.trim() === '') return null
  return encryptSecret(value.trim())
}

export async function settingsRoutes(app: FastifyInstance) {
  // Configurações públicas da loja (checkout e rodapé)
  app.get('/public', async (_request, reply) => {
    const settings = await getOrCreateSettings()

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

  // Configurações completas (Admin) — segredos mascarados
  app.get('/', { preHandler: [authenticate, authorize('ADMIN')] }, async (_request, reply) => {
    const settings = await getOrCreateSettings()
    return reply.send({ settings: toAdminView(settings) })
  })

  // Atualizar configurações e chaves de API (Admin)
  app.put('/', { preHandler: [authenticate, authorize('ADMIN')] }, async (request, reply) => {
    const data = UpdateSettingsSchema.parse(request.body)

    const plainFields = {
      storeName: data.storeName,
      legalName: data.legalName || null,
      documentNumber: data.documentNumber || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      supportWhatsapp: data.supportWhatsapp || null,
      freeShippingThreshold: data.freeShippingThreshold,
      stripeEnabled: data.stripeEnabled,
      stripePublishableKey: data.stripePublishableKey || null,
      mercadoPagoEnabled: data.mercadoPagoEnabled,
      mercadoPagoPublicKey: data.mercadoPagoPublicKey || null,
      pixKey: data.pixKey || null,
    }

    const secretFields: Partial<Record<(typeof SECRET_FIELDS)[number], string | null>> = {}
    for (const field of SECRET_FIELDS) {
      const resolved = resolveSecret(data[field])
      if (resolved !== undefined) secretFields[field] = resolved
    }

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: { ...plainFields, ...secretFields },
      create: { id: 'default', ...plainFields, ...secretFields },
    })

    return reply.send({
      success: true,
      message: 'Configurações da loja salvas com sucesso',
      settings: toAdminView(settings),
    })
  })
}
