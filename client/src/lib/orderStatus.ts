export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  CONFIRMED: 'Pagamento confirmado',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  FAILED: 'Não aprovado',
  REFUNDED: 'Reembolsado',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
}

/** Cor do selo de status do pedido. */
export function statusTone(status: string): string {
  if (status === 'PENDING') return 'bg-warn-soft text-warn'
  if (status === 'CANCELLED' || status === 'REFUNDED') return 'bg-danger-soft text-danger'
  if (status === 'DELIVERED') return 'bg-ok-soft text-ok'
  return 'bg-stage text-ink'
}

/** Etapas mostradas na linha do tempo do pedido. */
export const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const
