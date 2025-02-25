import { makeFindAllProductUseCase } from '@/use-cases/factory/make-find-all-product-use-case'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export function findAllProducts(request: FastifyRequest, reply: FastifyReply) {
  const registerQuerySchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  })

  const { page, limit } = registerQuerySchema.parse(request.query)

  const findAllProductUseCase = makeFindAllProductUseCase()

  const products = findAllProductUseCase.handler(page, limit)

  return reply.status(200).send(products)
}
