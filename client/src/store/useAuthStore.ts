import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'

/**
 * Guarda apenas os dados do usuário para a interface.
 * A sessão em si fica nos cookies httpOnly (access_token / refresh_token) definidos pela API;
 * nenhum token é salvo no navegador.
 */
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clear: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'nexus-auth',
      // v2: remove os tokens que a versão anterior guardava no localStorage
      version: 2,
      migrate: () => ({ user: null, isAuthenticated: false }),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
