import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async authenticate(createAuthDto: CreateAuthDto) {
    const user = await this.findUserByEmail(createAuthDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      createAuthDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  generateToken(userId: string) {
    const payload = { sub: userId };
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET)
      throw new UnauthorizedException('JWT configuration is missing');

    const token = sign(payload, JWT_SECRET!, {
      expiresIn: '14d',
    });

    return token;
  }
}
