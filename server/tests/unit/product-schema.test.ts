import { describe, it, expect } from 'vitest'
import { UpdateProductSchema } from '../../src/modules/products/products.schemas.js'

describe('Unit: edição parcial de produto', () => {
  it('não inventa estoque nem destaque quando eles não são enviados', () => {
    expect(UpdateProductSchema.parse({ price: 1999.9 })).toEqual({ price: 1999.9 })
  })

  it('mantém o estoque zero e o destaque falso quando são enviados', () => {
    expect(UpdateProductSchema.parse({ stock: 0, isFeatured: false })).toEqual({ stock: 0, isFeatured: false })
  })
})
