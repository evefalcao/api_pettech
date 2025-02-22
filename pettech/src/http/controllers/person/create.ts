import { PersonRepository } from '@/repositories/person.repository'
import { CreatePersonUseCase } from "@/use-cases/create-person"
import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    cpf: z.string(),
    name: z.string(),
    birth: z.coerce.date(),
    email: z.string().email(),
  })

  const { cpf, name, birth, email } = registerBodySchema.parse(request.body)

  try {
    const personRepository = new PersonRepository()
    const createPersonUseCase = new CreatePersonUseCase(personRepository)

    await createPersonUseCase.handler({ cpf, name, birth, email })
    reply.status(201).send()
  } catch (error) {
    console.error(error)

    throw new Error('Internal Server Error')
  }
}