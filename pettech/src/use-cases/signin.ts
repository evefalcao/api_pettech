import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { IUserRepository } from '@/repositories/user.repository.interface'

export class SigninUseCase {
  constructor(private userRepository: IUserRepository) {}

  async handler(username: string) {
    const user = await this.userRepository.findByUsername(username)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    return user
  }
}
