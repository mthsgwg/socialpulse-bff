import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const newUser = {
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
      };

      return await this.prisma.user.create({ data: newUser });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          if (field?.includes('username')) {
            throw new ConflictException('Username already exists');
          }
          if (field?.includes('email')) {
            throw new ConflictException('Email already exists');
          }
          throw new ConflictException(
            'A user with this information already exists',
          );
        }
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findOneByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
