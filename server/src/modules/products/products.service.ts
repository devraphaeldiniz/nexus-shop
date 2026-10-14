import { prisma } from '../../config/prisma.js'
import { redis } from '../../config/redis.js'
import { NotFoundError, ConflictError } from '../../utils/errors.js'
import {
  ProductQueryInput,
  CreateProductInput,
  UpdateProductInput,
} from './products.schemas.js'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export class ProductService {
  async list(query: ProductQueryInput) {
    const {
      page,
      limit,
      brand,
      minPrice,
      maxPrice,
      sort,
      search,
      featured,
    } = query

    const skip = (page - 1) * limit
    const where: any = { isActive: true }

    if (brand) {
      const brands = brand.split(',').map((b) => b.trim())
      where.brand = { in: brands, mode: 'insensitive' }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    if (featured !== undefined) {
      where.isFeatured = featured
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { avgRating: 'desc' }
        break
      case 'popular':
        orderBy = { totalSold: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            orderBy: { position: 'asc' },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getBySlug(slug: string) {
    const cacheKey = `product:${slug}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // Continue to DB if JSON parse fails
      }
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: 'asc' } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!product || !product.isActive) {
      throw new NotFoundError('Smartphone não encontrado')
    }

    await redis.setex(cacheKey, 1800, JSON.stringify(product)) // 30 min cache
    return product
  }

  async create(data: CreateProductInput) {
    const slug = slugify(`${data.brand}-${data.name}`)

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (existingSku) throw new ConflictError('SKU já cadastrado no estoque')

    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) throw new ConflictError('Smartphone com este nome já existe')

    const { images, ...productData } = data

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        images: {
          create: images.map((url, index) => ({
            url,
            position: index,
            alt: `${data.name} - Foto ${index + 1}`,
          })),
        },
      },
      include: { images: true },
    })

    return product
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Produto não encontrado')

    const { images, ...productData } = data

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(data.name ? { slug: slugify(`${data.brand || existing.brand}-${data.name}`) } : {}),
      },
      include: { images: true },
    })

    await redis.del(`product:${existing.slug}`)
    if (updated.slug !== existing.slug) {
      await redis.del(`product:${updated.slug}`)
    }

    return updated
  }

  async delete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) throw new NotFoundError('Produto não encontrado')

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    await redis.del(`product:${product.slug}`)
    return { success: true, message: 'Produto desativado com sucesso' }
  }

  async getBrands() {
    const cacheKey = 'products:brands'
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const brands = await prisma.product.findMany({
      where: { isActive: true },
      distinct: ['brand'],
      select: { brand: true },
    })

    const list = brands.map((b) => b.brand).sort()
    await redis.setex(cacheKey, 3600, JSON.stringify(list))
    return list
  }
}
