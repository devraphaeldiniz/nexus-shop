import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', authorize('ADMIN'))

  // Métricas do Dashboard
  app.get('/metrics', async (_request, reply) => {
    const [
      totalUsers,
      totalOrders,
      paidOrders,
      productsCount,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { total: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { stock: { lte: 10 }, isActive: true },
        select: { id: true, name: true, stock: true, brand: true },
        take: 10,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0)

    return reply.send({
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers: totalUsers,
        totalProducts: productsCount,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentOrders,
    })
  })

  // Listar clientes
  app.get('/users', async (request, reply) => {
    const query = request.query as { page?: string; limit?: string }
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count(),
    ])

    return reply.send({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })
}
