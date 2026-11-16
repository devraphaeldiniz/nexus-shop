import { test, expect } from '@playwright/test'

test.describe('Vitrine', () => {
  test('home mostra destaque, mais vendidos e todas as marcas', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Comprar agora' }).or(page.getByRole('link', { name: 'Comprar agora' })).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mais vendidos' })).toBeVisible()
    for (const brand of ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Motorola', 'Nothing']) {
      await expect(page.locator(`a[href="/products?brand=${brand}"]`).first()).toBeVisible()
    }
  })

  test('filtro por marca e busca encontram o aparelho certo', async ({ page }) => {
    await page.goto('/products?brand=Nothing')
    await expect(page.getByText('1 aparelho', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nothing Phone (2)' }).or(page.getByText('Nothing Phone (2)')).first()).toBeVisible()

    await page.goto('/products?search=Pixel')
    await expect(page.getByText(/aparelhos?$/).first()).toBeVisible()
    const names = await page.locator('main a[href^="/products/"]').allInnerTexts()
    expect(names.join(' ')).toContain('Pixel')
    expect(names.join(' ')).not.toContain('iPhone')
  })

  test('página do produto mostra foto do modelo e ficha técnica', async ({ page }) => {
    await page.goto('/products/samsung-galaxy-s25-ultra')
    await expect(page.getByRole('heading', { level: 1, name: /Galaxy S25 Ultra/ })).toBeVisible()
    const photo = page.locator('main img').first()
    await expect(photo).toBeVisible()
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByText('Snapdragon 8 Elite for Galaxy', { exact: true })).toBeVisible()
  })

  test('produto inexistente mostra página de não encontrado', async ({ page }) => {
    const response = await page.goto('/products/celular-que-nao-existe')
    expect(response?.status()).toBeLessThan(500)
    await expect(page.getByText(/não encontrad/i).first()).toBeVisible()
  })

  test('carrinho: adiciona, aumenta, diminui e remove', async ({ page }) => {
    await page.goto('/products')
    await page.getByRole('button', { name: /Adicionar .* ao carrinho/ }).first().click()

    const drawer = page.getByRole('dialog', { name: 'Carrinho' })
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(page.getByRole('button', { name: /Carrinho com 2 itens/ })).toBeVisible()
    await drawer.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(page.getByRole('button', { name: /Carrinho com 1 item/ })).toBeVisible()
    await drawer.getByRole('button', { name: /^Remover / }).click()
    await expect(drawer.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('páginas institucionais abrem', async ({ page }) => {
    for (const path of ['/contact', '/returns', '/terms', '/shipping-policy']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('heading', { level: 1 }), path).toBeVisible()
    }
  })
})
