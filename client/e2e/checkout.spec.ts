import { test, expect, Page } from '@playwright/test'

/**
 * Por padrão os testes usam a conta de demonstração (senha pública, criada pelo seed).
 * Para testar com outra conta: E2E_CUSTOMER_EMAIL e E2E_CUSTOMER_PASSWORD.
 */
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL || 'cliente.demo@nexusshop.com'
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD || 'Demo1234'

async function loginAsCustomer(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('seu.email@exemplo.com').fill(CUSTOMER_EMAIL)
  await page.getByPlaceholder('••••••••').fill(CUSTOMER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/')
}

test.describe('Compra', () => {
  test('cliente compra um smartphone com PIX e vê o pedido', async ({ page }) => {
    await loginAsCustomer(page)

    // Produto
    await page.goto('/products')
    await page.locator('a[href^="/products/"]').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('button', { name: 'Comprar agora' }).click()

    // Checkout: o cliente demo tem endereço padrão, então o frete é calculado sozinho
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByText('Escolha o frete')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /PIX \(Mercado Pago\)/ }).click()
    await page.getByRole('button', { name: /Confirmar Pedido/ }).click()

    // Pedido criado (o QR Code depende de credenciais reais do Mercado Pago)
    await expect(page.getByRole('heading', { name: 'Pedido registrado!' })).toBeVisible({ timeout: 15_000 })
    const orderCode = (await page.getByTestId('order-code').textContent())?.replace('#', '').trim()
    expect(orderCode).toBeTruthy()

    await page.goto('/orders')
    await expect(page.getByText(`Pedido #${orderCode}`)).toBeVisible()
    await expect(page.getByText('Aguardando pagamento').first()).toBeVisible()
  })

  test('cupom inválido mostra erro e válido aplica desconto', async ({ page }) => {
    await loginAsCustomer(page)
    await page.goto('/products')
    await page.locator('a[href^="/products/"]').first().click()
    await page.getByRole('button', { name: 'Comprar agora' }).click()

    await page.getByPlaceholder('Código do cupom').fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido ou inativo')).toBeVisible()

    await page.getByPlaceholder('Código do cupom').fill('NEXUS10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/Cupom aplicado/)).toBeVisible()
    await expect(page.getByText('Desconto')).toBeVisible()
  })

  test('visitante sem login entra e volta para o checkout', async ({ page }) => {
    await page.goto('/products')
    await page.locator('a[href^="/products/"]').first().click()
    await page.getByRole('button', { name: 'Comprar agora' }).click()

    await expect(page.getByText('Entre na sua conta para concluir a compra.')).toBeVisible()
    await page.getByRole('button', { name: 'Entrar para finalizar' }).click()
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout|\/login\?next=\/checkout/)

    await page.getByRole('button', { name: 'Entrar como cliente' }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByText('Escolha o frete')).toBeVisible({ timeout: 15_000 })
  })
})

test('visitante cria conta, entra e sai', async ({ page }) => {
  const email = `e2e-${Date.now()}@teste.com`
  await page.goto('/register')
  await page.getByPlaceholder('Ex: Lucas Ferreira').fill('Pessoa E2E')
  await page.getByPlaceholder('seu.email@exemplo.com').fill(email)
  await page.getByPlaceholder(/8\+ caracteres/).fill('SenhaE2e123')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByTitle('Minha conta')).toContainText('Pessoa')

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()

  await page.getByTitle('Sair').click()
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
})

test('login com senha errada mostra erro', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('seu.email@exemplo.com').fill(CUSTOMER_EMAIL)
  await page.getByPlaceholder('••••••••').fill('SenhaErrada999')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('Credenciais inválidas')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})
