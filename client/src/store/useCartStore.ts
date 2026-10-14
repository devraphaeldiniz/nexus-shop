import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '../types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, color?: string, storage?: string) => void
  updateQuantity: (productId: string, quantity: number, color?: string, storage?: string) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.color === newItem.color &&
              item.storage === newItem.storage
          )

          if (existingIndex > -1) {
            const updated = [...state.items]
            updated[existingIndex].quantity += newItem.quantity
            return { items: updated, isOpen: true }
          }

          const id = `${newItem.productId}-${newItem.color || 'default'}-${newItem.storage || 'default'}`
          return { items: [...state.items, { ...newItem, id }], isOpen: true }
        })
      },

      removeItem: (productId, color, storage) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.color === color &&
                item.storage === storage
              )
          ),
        }))
      },

      updateQuantity: (productId, quantity, color, storage) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, storage)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            item.color === color &&
            item.storage === storage
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'nexus-cart',
    }
  )
)
