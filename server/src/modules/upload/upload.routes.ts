import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { BadRequestError } from '../../utils/errors.js'
import { env } from '../../config/env.js'

/** Extensão decidida pelo tipo do arquivo, nunca pelo nome enviado. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export async function uploadRoutes(app: FastifyInstance) {
  // Rota estática para servir as imagens enviadas
  const uploadDir = path.resolve(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // Upload autenticado restrito para Administrador
  app.post(
    '/',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const data = await request.file()

      if (!data) {
        throw new BadRequestError('Nenhum arquivo enviado')
      }

      // Validação de tipo MIME
      const ext = EXTENSION_BY_MIME[data.mimetype]
      if (!ext) {
        throw new BadRequestError('Formato inválido. Apenas JPG, PNG ou WEBP são aceitos.')
      }

      // Nome único criptográfico para evitar colisões e path traversal
      const randomName = `${crypto.randomBytes(16).toString('hex')}${ext}`
      const filePath = path.join(uploadDir, randomName)

      // Salvar arquivo em disco com stream
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath)
        data.file.pipe(writeStream)
        writeStream.on('finish', () => resolve())
        writeStream.on('error', (err) => reject(err))
      })

      if (data.file.truncated) {
        fs.unlink(filePath, () => undefined)
        throw new BadRequestError('Arquivo maior que 10MB.')
      }

      // URL absoluta quando a API tem endereço público (o produto exige URL completa)
      const fileUrl = `${env.API_PUBLIC_URL?.replace(/\/$/, '') ?? ''}/uploads/${randomName}`
      return reply.status(201).send({ url: fileUrl, filename: randomName })
    }
  )
}
