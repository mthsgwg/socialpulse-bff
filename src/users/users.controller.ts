import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PublicUserResponseDto } from './dto/public-user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get('/me')
  async getProfile(@Req() req) {
    const user: User | null = req?.user;

    return this.usersService.returnUser(user);
  }

  @Get('/username/:username')
  findOne(@Param('username') username: string): Promise<PublicUserResponseDto> {
    return this.usersService.findOneByUsername(username);
  }
}
