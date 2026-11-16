import { prisma } from '../../config/prisma.js'
import { BadRequestError } from '../../utils/errors.js'

/**
 * Fonte única das opções de frete. Usada tanto no cálculo exibido no checkout
 * (POST /shipping/calculate) quanto na criação do pedido (OrderService.create).
 */
export const SHIPPING_OPTION_IDS = ['express', 'standard'] as const
export type ShippingOptionId = (typeof SHIPPING_OPTION_IDS)[number]

const BASE_OPTIONS: Array<{ id: ShippingOptionId; name: string; deadline: string; price: number }> = [
  { id: 'express', name: 'Envio Expresso com Seguro', deadline: '2 a 4 dias úteis', price: 39.9 },
  { id: 'standard', name: 'Envio Econômico', deadline: '5 a 8 dias úteis', price: 19.9 },
]

export interface ShippingOption {
  id: ShippingOptionId
  name: string
  deadline: string
  price: number
  isFree: boolean
}

/** Frete grátis quando o lojista define freeShippingThreshold > 0 e o subtotal o atinge. */
export async function getShippingOptions(subtotal: number): Promise<ShippingOption[]> {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
  const threshold = Number(settings?.freeShippingThreshold || 0)
  const isFree = threshold > 0 && subtotal >= threshold

  return BASE_OPTIONS.map((option) => ({
    ...option,
    price: isFree ? 0 : option.price,
    isFree,
  }))
}

export async function getShippingOption(subtotal: number, optionId: ShippingOptionId): Promise<ShippingOption> {
  const options = await getShippingOptions(subtotal)
  const option = options.find((o) => o.id === optionId)
  if (!option) throw new BadRequestError('Opção de frete inválida')
  return option
}
