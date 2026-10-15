import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { BadRequestError } from '../../utils/errors.js'

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
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedMimes.includes(data.mimetype)) {
        throw new BadRequestError('Formato inválido. Apenas JPG, PNG ou WEBP são aceitos.')
      }

      // Nome único criptográfico para evitar colisões e path traversal
      const ext = path.extname(data.filename) || '.jpg'
      const randomName = `${crypto.randomBytes(16).toString('hex')}${ext}`
      const filePath = path.join(uploadDir, randomName)

      // Salvar arquivo em disco com stream
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath)
        data.file.pipe(writeStream)
        writeStream.on('finish', () => resolve())
        writeStream.on('error', (err) => reject(err))
      })

      const fileUrl = `/uploads/${randomName}`
      return reply.status(201).send({ url: fileUrl, filename: randomName })
    }
  )
}
