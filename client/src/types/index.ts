export interface ProductSpecifications {
  screenSize: string
  resolution: string
  processor: string
  ram: number
  storage: number
  battery: number
  mainCamera: string
  frontCamera: string
  os: string
  weight?: number
  charging?: string
  colors: string[]
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  position: number
}

export interface Review {
  id: string
  userId: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  createdAt: string
  user: {
    name: string
    avatar?: string
  }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  brand: string
  model: string
  sku: string
  stock: number
  specifications: ProductSpecifications
  isFeatured: boolean
  isActive: boolean
  avgRating: number
  totalReviews: number
  totalSold: number
  images: ProductImage[]
  reviews?: Review[]
}

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  brand: string
  price: number
  quantity: number
  color?: string
  storage?: string
  image: string
  stock: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  avatar?: string
  phone?: string
  /** Conta de demonstração (senha pública): admin só lê, cliente não troca e-mail/senha */
  isDemo?: boolean
  addresses?: Address[]
}

export interface Address {
  id: string
  label: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  color?: string
  storage?: string
}

export interface Order {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentGateway: 'STRIPE' | 'MERCADOPAGO'
  paymentMethod: 'CREDIT_CARD' | 'PIX'
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  trackingCode?: string
  createdAt: string
  items: OrderItem[]
  address: Address
}
