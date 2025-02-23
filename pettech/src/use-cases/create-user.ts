import { User } from "@/entities/user.entity"
import { UserRepository } from "@/repositories/user.reposititory"

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async handler(user: User): Promise<User | undefined> {
    return this.userRepository.create(user)
  }
}