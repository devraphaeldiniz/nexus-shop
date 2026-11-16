'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Package, Trash2, User as UserIcon } from 'lucide-react'
import { apiFetch, ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'
import { Address, User } from '../../types'

const inputClass = 'field'
const emptyAddress = { label: 'Casa', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' }

interface WishlistItem {
  id: string
  productId: string
  product: { name: string; slug: string; price: number; image: string; stock: number }
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel space-y-5 p-6 md:p-8">
      <h2 className="flex items-center gap-2 text-xl font-bold">{icon}{title}</h2>
      {children}
    </section>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  const [profile, setProfile] = useState({ name: '', phone: '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [newAddress, setNewAddress] = useState(emptyAddress)
  const [addressMsg, setAddressMsg] = useState('')
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  const loadAddresses = useCallback(() => {
    apiFetch<{ addresses: Address[] }>('/account/addresses').then((d) => setAddresses(d.addresses)).catch(() => undefined)
  }, [])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) {
      router.push('/login?next=/account')
      return
    }
    apiFetch<{ user: User }>('/auth/me')
      .then(({ user: me }) => setProfile({ name: me.name, phone: me.phone || '' }))
      .catch(() => undefined)
    loadAddresses()
    apiFetch<{ items: WishlistItem[] }>('/wishlist').then((d) => setWishlist(d.items)).catch(() => undefined)
  }, [mounted, isAuthenticated, router, loadAddresses])

  const message = (err: unknown) => (err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setProfileMsg('')
    try {
      const data = await apiFetch<{ user: User }>('/account/profile', { method: 'PATCH', body: profile })
      setUser({ ...user!, ...data.user })
      setProfileMsg('Dados atualizados.')
    } catch (err) {
      setProfileMsg(message(err))
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordMsg('')
    try {
      const data = await apiFetch<{ message: string }>('/account/password', { method: 'POST', body: passwords })
      setPasswords({ currentPassword: '', newPassword: '' })
      setPasswordMsg(data.message)
    } catch (err) {
      setPasswordMsg(err instanceof ApiError && err.status === 401 ? 'Senha atual incorreta.' : message(err))
    }
  }

  async function lookupZip() {
    const zip = newAddress.zipCode.replace(/\D/g, '')
    if (zip.length !== 8) return
    try {
      const data = await apiFetch<{ address: { street: string; neighborhood: string; city: string; state: string } }>(
        '/shipping/calculate',
        { method: 'POST', body: { zipCode: zip, subtotal: 0 } }
      )
      setNewAddress((prev) => ({
        ...prev,
        street: data.address.street || prev.street,
        neighborhood: data.address.neighborhood || prev.neighborhood,
        city: data.address.city || prev.city,
        state: data.address.state || prev.state,
      }))
    } catch {
      // Preenchimento manual
    }
  }

  async function addAddress(event: FormEvent) {
    event.preventDefault()
    setAddressMsg('')
    try {
      await apiFetch('/account/addresses', {
        method: 'POST',
        body: { ...newAddress, complement: newAddress.complement || undefined },
      })
      setNewAddress(emptyAddress)
      loadAddresses()
    } catch (err) {
      setAddressMsg(message(err))
    }
  }

  async function setDefault(id: string) {
    await apiFetch(`/account/addresses/${id}/default`, { method: 'PATCH' }).catch(() => undefined)
    loadAddresses()
  }

  async function removeAddress(id: string) {
    if (!confirm('Remover este endereço?')) return
    await apiFetch(`/account/addresses/${id}`, { method: 'DELETE' }).catch(() => undefined)
    loadAddresses()
  }

  async function removeFavorite(productId: string) {
    await apiFetch('/wishlist/toggle', { method: 'POST', body: { productId } }).catch(() => undefined)
    setWishlist((items) => items.filter((i) => i.productId !== productId))
  }

  if (!mounted || !isAuthenticated) return null

  return (
    <main className="container max-w-4xl space-y-6 pt-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Minha conta</h1>
          <p className="mt-1 text-graphite">{user?.email}</p>
        </div>
        <Link href="/orders" className="btn-primary">
          <Package className="w-4 h-4" /> Meus pedidos
        </Link>
      </div>

      {user?.isDemo && (
        <p className="notice-warn">
          Esta é a conta de demonstração: nome, e-mail e senha ficam fixos para todo mundo conseguir entrar. Endereços,
          carrinho e pedidos funcionam normalmente.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Dados pessoais" icon={<UserIcon className="h-5 w-5 text-graphite" />}>
          <form onSubmit={saveProfile}>
            <fieldset disabled={!!user?.isDemo} className="space-y-3 disabled:opacity-60">
            <input required minLength={2} className={inputClass} placeholder="Nome" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <input className={inputClass} placeholder="Telefone / WhatsApp" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            {profileMsg && <p className="text-xs text-ink">{profileMsg}</p>}
            <button className="btn-ghost">Salvar</button>
            </fieldset>
          </form>
        </Section>

        <Section title="Trocar senha" icon={<UserIcon className="h-5 w-5 text-graphite" />}>
          <form onSubmit={changePassword}>
            <fieldset disabled={!!user?.isDemo} className="space-y-3 disabled:opacity-60">
            <input required type="password" autoComplete="current-password" className={inputClass} placeholder="Senha atual" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            <input required type="password" autoComplete="new-password" minLength={8} className={inputClass} placeholder="Nova senha" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            <p className="text-[11px] text-graphite">8+ caracteres, maiúscula, minúscula e número.</p>
            {passwordMsg && <p className="text-xs text-ink">{passwordMsg}</p>}
            <button className="btn-ghost">Alterar senha</button>
            </fieldset>
          </form>
        </Section>
      </div>

      <Section title="Endereços" icon={<MapPin className="h-5 w-5 text-graphite" />}>
        {addresses.length === 0 && <p className="text-xs text-graphite">Nenhum endereço salvo. Os endereços usados no checkout aparecem aqui.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={`rounded-lg border p-3 text-xs ${a.isDefault ? 'border-ink bg-paper' : 'border-line'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{a.label}{a.isDefault ? ' · padrão' : ''}</span>
                <button onClick={() => removeAddress(a.id)} title="Remover" className="text-graphite hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="mt-1 text-ink">{a.street}, {a.number}{a.complement ? ` - ${a.complement}` : ''}</p>
              <p className="text-graphite">{a.neighborhood} · {a.city}/{a.state} · {a.zipCode}</p>
              {!a.isDefault && <button onClick={() => setDefault(a.id)} className="mt-2 text-signal hover:underline">Usar como padrão</button>}
            </div>
          ))}
        </div>

        <form onSubmit={addAddress} className="grid gap-2 sm:grid-cols-6 border-t border-line pt-4">
          <p className="sm:col-span-6 text-xs font-semibold text-ink">Novo endereço</p>
          <input className={`${inputClass} sm:col-span-2`} placeholder="Apelido (Casa, Trabalho)" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
          <input required className={`${inputClass} sm:col-span-2`} placeholder="CEP" maxLength={9} value={newAddress.zipCode} onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })} onBlur={lookupZip} />
          <input required className={`${inputClass} sm:col-span-2`} placeholder="Número" value={newAddress.number} onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })} />
          <input required className={`${inputClass} sm:col-span-4`} placeholder="Rua" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} />
          <input className={`${inputClass} sm:col-span-2`} placeholder="Complemento" value={newAddress.complement} onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })} />
          <input required className={`${inputClass} sm:col-span-2`} placeholder="Bairro" value={newAddress.neighborhood} onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })} />
          <input required className={`${inputClass} sm:col-span-3`} placeholder="Cidade" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
          <input required maxLength={2} className={`${inputClass} uppercase`} placeholder="UF" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })} />
          {addressMsg && <p className="sm:col-span-6 text-xs text-danger">{addressMsg}</p>}
          <button className="btn-primary sm:col-span-2">Adicionar endereço</button>
        </form>
      </Section>

      <Section title="Favoritos" icon={<Heart className="h-5 w-5 text-graphite" />}>
        {wishlist.length === 0 && <p className="text-xs text-graphite">Você ainda não favoritou nenhum smartphone.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {wishlist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-line p-3 text-xs">
              {item.product.image ? (
                <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded object-cover bg-white" />
              ) : (
                <div className="w-12 h-12 rounded bg-white" />
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-semibold text-ink hover:underline truncate block">{item.product.name}</Link>
                <p className="text-graphite">{formatCurrency(item.product.price)}{item.product.stock <= 0 ? ' · esgotado' : ''}</p>
              </div>
              <button onClick={() => removeFavorite(item.productId)} title="Remover dos favoritos" className="text-danger"><Heart className="w-4 h-4 fill-signal" /></button>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
