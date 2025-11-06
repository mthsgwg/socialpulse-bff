import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private throwError(msg: string): void {
    throw new UnauthorizedException(msg);
  }

  private findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async authenticate(createAuthDto: CreateAuthDto) {
    const user = await this.findUserByEmail(createAuthDto.email);

    if (!user) {
      this.throwError('Invalid credentials');
      return;
    }

    const passwordMatches = await bcrypt.compare(
      createAuthDto.password,
      user.password,
    );

    if (!passwordMatches) {
      this.throwError('Invalid credentials');
      return;
    }

    return user;
  }

  generateToken(userId: string) {
    const payload = { sub: userId };
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET) this.throwError('JWT configuration is missing');

    const token = sign(payload, JWT_SECRET!, {
      expiresIn: '14d',
    });

    return token;
  }
}
