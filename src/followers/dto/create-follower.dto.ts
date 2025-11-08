import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFollowerDto {
  @IsString()
  @IsNotEmpty()
  followerUsername: string;

  @IsString()
  @IsNotEmpty()
  followingUsername: string;
}
