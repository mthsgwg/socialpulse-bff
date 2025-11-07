import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() createAuthDto: CreateAuthDto): Promise<LoginResponseDto> {
    const user = await this.authService.authenticate(createAuthDto);

    if (!user) {
      throw new Error('Authentication failed');
    }

    const token = this.authService.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      expiresIn: '14d',
    };
  }
}
