import { test, expect } from '@playwright/test'

test.describe('Contas de demonstração', () => {
  test('cliente demo entra pelo botão da tela de login e não troca a senha', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Quer só conhecer a loja?' })).toBeVisible()
    await page.getByRole('button', { name: 'Entrar como cliente' }).click()
    await expect(page).toHaveURL('/')

    await page.goto('/account')
    await expect(page.getByText(/Esta é a conta de demonstração/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Alterar senha' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  test('admin demo vê todas as abas do painel, mas não consegue salvar', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar como admin' }).click()
    await expect(page).toHaveURL('/admin')
    await expect(page.getByTestId('demo-readonly')).toBeVisible()

    // Produtos carregam
    await expect(page.getByText('NEXUS-SAM-S25U-512')).toBeVisible()

    // Pedidos e configurações abrem
    await page.getByRole('button', { name: 'Pedidos' }).click()
    await page.getByRole('button', { name: /Pagamentos/ }).click()
    const save = page.getByRole('button', { name: 'Salvar configurações' })
    await expect(save).toBeVisible()

    // Tentar salvar mostra o aviso de somente leitura
    await save.click()
    await expect(page.getByText(/somente leitura/).last()).toBeVisible()
  })
})
