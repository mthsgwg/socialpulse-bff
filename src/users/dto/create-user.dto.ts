import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}

export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
