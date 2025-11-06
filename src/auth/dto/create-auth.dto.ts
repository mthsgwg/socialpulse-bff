import { IsEmail, Length } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  email: string;

  @Length(6, 20)
  password: string;
}
