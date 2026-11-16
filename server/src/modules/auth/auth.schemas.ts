import { z } from 'zod'

const PasswordSchema = z
  .string()
  .min(8, 'A senha deve conter no mínimo 8 caracteres')
  .max(128, 'A senha deve conter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('E-mail inválido'),
  password: PasswordSchema,
  phone: z.string().trim().max(30).optional(),
})

/** Criação do primeiro administrador da loja (só funciona enquanto não houver admin). */
export const SetupSchema = RegisterSchema.omit({ phone: true }).extend({
  setupToken: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, 'Token inválido'),
  newPassword: PasswordSchema,
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type SetupInput = z.infer<typeof SetupSchema>
export type LoginInput = z.infer<typeof LoginSchema>
