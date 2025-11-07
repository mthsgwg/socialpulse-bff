import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { verify } from 'jsonwebtoken';
import { User } from 'src/users/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  private throwError(msg: string, statusCode?: number): void {
    throw new UnauthorizedException({
      message: msg,
      statusCode: statusCode ? statusCode : 401,
    });
  }

  private checkAuthHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.throwError('Invalid or missing authorization header', 401);
      return null;
    }

    return authHeader;
  }

  private checkToken(token: string): string | null {
    if (!token) {
      this.throwError('Invalid or missing token', 401);
      return null;
    }

    return token;
  }

  private checkJwtSecret(): string {
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET) {
      this.throwError('JWT configuration is missing', 500);
    }

    return JWT_SECRET!;
  }

  private decodeToken(token: string, jwtSecret: string): any {
    try {
      const { sub } = verify(token, jwtSecret);
      return sub;
    } catch (error) {
      this.throwError('Invalid or expired token', 401);
    }
  }

  private async validateUser(userId): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        this.throwError('User not found', 404);
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = this.checkAuthHeader(req);
    if (!authHeader) return;

    // Pega o token do header (Bearer token)
    const [, token] = authHeader.split(' ');
    this.checkToken(token);

    const JWT_SECRET = this.checkJwtSecret();

    const userId = this.decodeToken(token, JWT_SECRET);

    const user = await this.validateUser(userId);

    if (!user) return;

    req.user = user;

    next();
  }
}
