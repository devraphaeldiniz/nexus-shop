import { prisma } from '../../config/prisma.js'
import { NotFoundError, BadRequestError } from '../../utils/errors.js'

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { position: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    )

    return {
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        brand: item.product.brand,
        price: Number(item.product.price),
        quantity: item.quantity,
        color: item.color,
        storage: item.storage,
        image: item.product.images[0]?.url || '',
        stock: item.product.stock,
      })),
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    }
  }

  async addItem(
    userId: string,
    productId: string,
    quantity = 1,
    color?: string,
    storage?: string
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || !product.isActive) {
      throw new NotFoundError('Smartphone indisponível')
    }

    if (product.stock < quantity) {
      throw new BadRequestError(`Estoque insuficiente. Apenas ${product.stock} unidades disponíveis.`)
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        color: color || null,
        storage: storage || null,
      },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      if (product.stock < newQty) {
        throw new BadRequestError(`Estoque insuficiente para adicionar mais unidades.`)
      }

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          color,
          storage,
        },
      })
    }

    return this.getCart(userId)
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, cartItemId)
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { product: true },
    })

    if (!item) throw new NotFoundError('Item do carrinho não encontrado')

    if (item.product.stock < quantity) {
      throw new BadRequestError(`Estoque insuficiente. Máximo: ${item.product.stock}`)
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    })

    return this.getCart(userId)
  }

  async removeItem(userId: string, cartItemId: string) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId },
    })
    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({
      where: { userId },
    })
    return { items: [], totalItems: 0, subtotal: 0 }
  }
}
