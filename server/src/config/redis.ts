import Redis from 'ioredis'
import { env } from './env.js'

class CacheClient {
  private redis: Redis | null = null
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>()
  public isConnected = false

  constructor() {
    try {
      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 2000)),
        lazyConnect: true,
      })

      this.redis.connect().then(() => {
        this.isConnected = true
        console.log('⚡ Redis conectado com sucesso!')
      }).catch(() => {
        console.warn('⚠️ Redis não disponível. Usando fallback em memória.')
      })

      this.redis.on('error', () => {
        this.isConnected = false
      })
    } catch {
      this.isConnected = false
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.redis) {
      try {
        return await this.redis.get(key)
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryStore.get(key)
    if (!item) return null
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key)
      return null
    }
    return item.value
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    if (this.isConnected && this.redis) {
      try {
        return (await this.redis.setex(key, seconds, value)) as 'OK'
      } catch {
        // Fallback
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    if (this.isConnected && this.redis) {
      try {
        return await this.redis.del(key)
      } catch {
        // Fallback
      }
    }
    const had = this.memoryStore.delete(key)
    return had ? 1 : 0
  }

  /** Apaga todas as chaves que começam com o prefixo (SCAN, sem travar o Redis). */
  async delByPrefix(prefix: string): Promise<number> {
    let removed = 0
    if (this.isConnected && this.redis) {
      try {
        const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 })
        for await (const keys of stream as AsyncIterable<string[]>) {
          if (keys.length > 0) removed += await this.redis.del(...keys)
        }
        return removed
      } catch {
        // Fallback
      }
    }
    for (const key of Array.from(this.memoryStore.keys())) {
      if (key.startsWith(prefix) && this.memoryStore.delete(key)) removed++
    }
    return removed
  }
}

export const redis = new CacheClient()
