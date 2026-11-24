import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { BadRequestError } from '../../utils/errors.js'
import { getShippingOptions } from './shipping.service.js'

const CalculateShippingSchema = z.object({
  zipCode: z.string().min(8).max(9),
  subtotal: z.number().nonnegative(),
})

interface ViaCepResponse {
  erro?: boolean | string
  localidade?: string
  uf?: string
  bairro?: string
  logradouro?: string
}

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
      const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
        signal: AbortSignal.timeout(5000),
      })
      if (response.ok) {
        const data = (await response.json()) as ViaCepResponse
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

    return reply.send({
      address: addressData,
      options: await getShippingOptions(subtotal),
    })
  })
}
