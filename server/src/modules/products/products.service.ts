import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { redis } from '../../config/redis.js'
import { NotFoundError, ConflictError } from '../../utils/errors.js'
import {
  ProductQueryInput,
  CreateProductInput,
  UpdateProductInput,
} from './products.schemas.js'

const BRANDS_CACHE_KEY = 'products:brands'

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
      ram,
      storage,
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.ProductWhereInput = { isActive: true }
    const and: Prisma.ProductWhereInput[] = []

    if (brand) {
      const brands = brand.split(',').map((b) => b.trim())
      where.brand = { in: brands, mode: 'insensitive' }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      }
    }

    // RAM e armazenamento ficam dentro do JSON "specifications"
    if (ram !== undefined) and.push({ specifications: { path: ['ram'], equals: ram } })
    if (storage !== undefined) and.push({ specifications: { path: ['storage'], equals: storage } })
    if (and.length > 0) where.AND = and

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

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
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

    await redis.del(BRANDS_CACHE_KEY)
    return product
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Produto não encontrado')

    const { images, ...productData } = data

    if (productData.sku && productData.sku !== existing.sku) {
      const skuInUse = await prisma.product.findUnique({ where: { sku: productData.sku } })
      if (skuInUse) throw new ConflictError('SKU já cadastrado no estoque')
    }

    const nextSlug =
      data.name || data.brand
        ? slugify(`${data.brand || existing.brand}-${data.name || existing.name}`)
        : existing.slug
    if (nextSlug !== existing.slug) {
      const slugInUse = await prisma.product.findUnique({ where: { slug: nextSlug } })
      if (slugInUse) throw new ConflictError('Smartphone com este nome já existe')
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Imagens: quando enviadas, substituem a galeria inteira na ordem recebida
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } })
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            productId: id,
            url,
            position: index,
            alt: `${data.name || existing.name} - Foto ${index + 1}`,
          })),
        })
      }

      return tx.product.update({
        where: { id },
        data: { ...productData, slug: nextSlug },
        include: { images: { orderBy: { position: 'asc' } } },
      })
    })

    await redis.del(`product:${existing.slug}`)
    if (updated.slug !== existing.slug) {
      await redis.del(`product:${updated.slug}`)
    }
    await redis.del(BRANDS_CACHE_KEY)

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
    await redis.del(BRANDS_CACHE_KEY)
    return { success: true, message: 'Produto desativado com sucesso' }
  }

  async getBrands() {
    const cacheKey = BRANDS_CACHE_KEY
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
