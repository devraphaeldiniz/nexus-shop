export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  model: string
  sku: string
  price: number | string
  compareAtPrice?: number | string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  images: { url: string }[]
  specifications: {
    screenSize?: string
    resolution?: string
    processor?: string
    ram?: number
    storage?: number
    battery?: number
    mainCamera?: string
    frontCamera?: string
    os?: string
    weight?: number
    charging?: string
    colors?: string[]
  }
}

export interface AdminOrder {
  id: string
  total: number | string
  status: string
  paymentStatus: string
  paymentGateway: string | null
  paymentMethod: string | null
  trackingCode?: string | null
  notes?: string | null
  createdAt: string
  user: { name: string; email: string }
  address: { street: string; number: string; city: string; state: string }
  items: { id: string; name: string; quantity: number; price: number | string }[]
}

export interface AdminMetrics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  lowStockCount: number
}

export interface StoreSettingsForm {
  storeName: string
  legalName: string
  documentNumber: string
  contactEmail: string
  contactPhone: string
  supportWhatsapp: string
  freeShippingThreshold: number
  stripeEnabled: boolean
  stripePublishableKey: string
  stripeSecretKey: string
  mercadoPagoEnabled: boolean
  mercadoPagoPublicKey: string
  mercadoPagoAccessToken: string
  pixKey: string
}

export const inputClass = 'field'
export const labelClass = 'field-label'

export function errorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  return err instanceof Error ? err.message : fallback
}
