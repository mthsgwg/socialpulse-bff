import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsString, Length, ValidateIf } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString({
    message: 'Username must be a string',
  })
  @Length(4, 16, {
    message: 'Username must be between 4 and 16 characters',
  })
  username?: string | undefined;

  @IsEmail()
  email?: string | undefined;
}
