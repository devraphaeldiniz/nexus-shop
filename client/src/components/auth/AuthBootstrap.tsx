'use client'

import { useEffect } from 'react'
import { apiFetch, ApiError } from '../../lib/api'
import { useAuthStore } from '../../store/useAuthStore'
import { User } from '../../types'

/**
 * Ao abrir o app, confirma a sessão com a API (GET /auth/me).
 * Restaura o usuário se o cookie ainda for válido e limpa o estado se a sessão acabou.
 */
export function AuthBootstrap() {
  useEffect(() => {
    apiFetch<{ user: User }>('/auth/me')
      .then(({ user }) => useAuthStore.getState().setUser(user))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          useAuthStore.getState().clear()
        }
      })
  }, [])

  return null
}
