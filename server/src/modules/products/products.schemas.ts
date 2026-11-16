import { z } from 'zod'

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  brand: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  ram: z.coerce.number().int().positive().optional(),
  storage: z.coerce.number().int().positive().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'popular']).default('newest'),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
})

export const CreateProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  brand: z.string().min(2),
  model: z.string().min(1),
  sku: z.string().min(3),
  stock: z.number().int().nonnegative().default(0),
  isFeatured: z.boolean().default(false),
  specifications: z.object({
    screenSize: z.string(),
    resolution: z.string(),
    processor: z.string(),
    ram: z.number().int().positive(),
    storage: z.number().int().positive(),
    battery: z.number().int().positive(),
    mainCamera: z.string(),
    frontCamera: z.string(),
    os: z.string(),
    weight: z.number().positive().optional(),
    charging: z.string().optional(),
    colors: z.array(z.string()).min(1),
  }),
  images: z.array(z.string().url()).min(1),
})

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  // Reativar/pausar o produto na vitrine pelo painel
  isActive: z.boolean().optional(),
  compareAtPrice: z.number().positive().nullable().optional(),
})

export type ProductQueryInput = z.infer<typeof ProductQuerySchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
