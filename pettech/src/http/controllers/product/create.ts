import { makeCreateProductUseCase } from '@/use-cases/factory/make-create-product-use-case'
import { createProductInStock } from '@/utils/client-http'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    description: z.string(),
    image: z.string(),
    price: z.coerce.number(),
    categories: z
      .array(
        z.object({
          id: z.coerce.number().optional(),
          name: z.string(),
        }),
      )
      .optional(),
  })

  const { name, description, image, price, categories } =
    registerBodySchema.parse(request.body)

  const createProductUseCase = makeCreateProductUseCase()

  const product = await createProductUseCase.handler({
    name,
    description,
    image,
    price,
    categories,
  })

  await createProductInStock(
    {
      name: product.name,
      quantity: 0,
      relationId: String(product.id),
    },
    request.headers.authorization?.split(' ')[1] ?? '',
  )

  return reply.status(201).send(product)
}
