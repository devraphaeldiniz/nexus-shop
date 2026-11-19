import { useAuthStore } from '../store/useAuthStore'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export class ApiError extends Error {
  status: number
  issues?: Array<{ field: string; message: string }>

  constructor(message: string, status: number, issues?: Array<{ field: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

/** Rotas em que um 401 é resposta final (não faz sentido tentar renovar a sessão). */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/setup', '/auth/logout']

let refreshPromise: Promise<boolean> | null = null

/** Renova a sessão uma única vez, mesmo com várias requisições simultâneas recebendo 401. */
function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null
        }, 0)
      })
  }
  return refreshPromise
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>) {
  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    if (query) url += `${url.includes('?') ? '&' : '?'}${query}`
  }
  return url
}

/** Faz a requisição com o cookie de sessão; em 401 renova a sessão uma vez e repete. */
async function fetchWithRefresh(url: string, init: RequestInit): Promise<Response> {
  const run = () => fetch(url, { ...init, credentials: 'include' })

  let response = await run()
  if (response.status === 401 && !NO_REFRESH_PATHS.some((p) => url.includes(p))) {
    const refreshed = await refreshSession()
    if (refreshed) {
      response = await run()
    }
    if (!refreshed || response.status === 401) {
      useAuthStore.getState().clear()
    }
  }
  return response
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>
  /** Objeto (enviado como JSON) ou FormData. */
  body?: unknown
}

/** Chamada à API com JSON, sessão por cookie e erro tipado (ApiError). */
export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetchWithRefresh(buildUrl(endpoint, params), {
    ...rest,
    headers: {
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.issues?.[0]?.message || data.message || `Erro ${response.status}: falha na requisição`
    throw new ApiError(message, response.status, data.issues)
  }

  return data as T
}

/** Encerra a sessão no servidor (limpa os cookies) e no navegador. */
export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
  } catch {
    // Mesmo offline, a sessão local é limpa
  }
  useAuthStore.getState().clear()
}
