import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { env } from './env.js'

export const mpClient = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
})

export const mpPreference = new Preference(mpClient)
export const mpPayment = new Payment(mpClient)
