import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { BadRequestError } from '../../utils/errors.js'

const CalculateShippingSchema = z.object({
  zipCode: z.string().min(8).max(9),
  subtotal: z.number().nonnegative(),
})

export async function shippingRoutes(app: FastifyInstance) {
  app.post('/calculate', async (request, reply) => {
    const { zipCode, subtotal } = CalculateShippingSchema.parse(request.body)
    const cleanZip = zipCode.replace(/\D/g, '')

    if (cleanZip.length !== 8) {
      throw new BadRequestError('CEP inválido. O CEP deve conter 8 dígitos.')
    }

    // Consulta oficial ViaCEP
    let addressData = {
      city: '',
      state: '',
      neighborhood: '',
      street: '',
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`)
      if (response.ok) {
        const data = await response.json()
        if (!data.erro) {
          addressData = {
            city: data.localidade || '',
            state: data.uf || '',
            neighborhood: data.bairro || '',
            street: data.logradouro || '',
          }
        }
      }
    } catch {
      // Continua com cálculo padrão se ViaCEP estiver instável
    }

    // Obter regra de frete configurada pelo lojista
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    const threshold = Number(settings?.freeShippingThreshold || 0)

    const isFree = threshold > 0 && subtotal >= threshold

    return reply.send({
      address: addressData,
      options: [
        {
          id: 'express',
          name: 'Envio Expresso com Seguro',
          deadline: '2 a 4 dias úteis',
          price: isFree ? 0 : 39.90,
          isFree,
        },
        {
          id: 'standard',
          name: 'Envio Econômico',
          deadline: '5 a 8 dias úteis',
          price: isFree ? 0 : 19.90,
          isFree,
        },
      ],
    })
  })
}
