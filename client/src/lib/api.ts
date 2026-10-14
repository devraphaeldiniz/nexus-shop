const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  // Obter token do localStorage se estiver no browser
  let token: string | null = null
  if (typeof window !== 'undefined') {
    try {
      const auth = localStorage.getItem('nexus-auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        token = parsed.state?.accessToken || null
      }
    } catch {}
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...rest,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.message || `Erro ${response.status}: Falha na requisição`
    throw new Error(message)
  }

  return data as T
}
