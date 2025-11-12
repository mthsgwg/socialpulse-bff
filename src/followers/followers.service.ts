import { PrismaService } from './../prisma/prisma.service';
import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from 'generated/prisma';
import { CreateFollowerDto } from './dto/create-follower.dto';
import { PublicUserResponseDto } from 'src/users/dto/public-user-response.dto';
import { PublicUser } from '../common/filters/user-to-public-user-response.filter';

@Injectable()
export class FollowersService {
  constructor(private readonly prismaService: PrismaService) {}

  private checkIfFollowingIsUser(
    createFollowerDto: CreateFollowerDto,
    user: User,
  ) {
    if (createFollowerDto.followingUsername === user.username)
      throw new ConflictException('A user cannot follow it-self');
  }

  private checkIfFollowerIsUser(
    createFollowerDto: CreateFollowerDto,
    user: User,
  ) {
    if (createFollowerDto.followerUsername !== user.username)
      throw new UnauthorizedException('The follower must be the user');
  }

  async create(createFollowerDto: CreateFollowerDto, user: User) {
    this.checkIfFollowerIsUser(createFollowerDto, user);
    this.checkIfFollowingIsUser(createFollowerDto, user);

    try {
      const result = await this.prismaService.follower.create({
        data: createFollowerDto,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async unfollow(usernameToBeUnfollowed: string, user: User) {
    try {
      const result = await this.prismaService.follower.findFirst({
        where: {
          followingUsername: usernameToBeUnfollowed,
          followerUsername: user.username,
        },
      });

      if (result === null)
        throw new HttpException('User relation not found', 404);

      return await this.prismaService.follower.delete({
        where: result,
      });
    } catch (error) {
      throw error;
    }
  }

  async findMyFollowers(user: User): Promise<PublicUserResponseDto[]> {
    try {
      const results = await this.prismaService.follower.findMany({
        where: {
          followingUsername: user.username,
        },
        include: {
          follower: true,
        },
      });

      const followers: PublicUserResponseDto[] = [];

      results.forEach((result) => {
        const _follower = new PublicUser(result.follower);
        followers.push(_follower.user);
      });

      return followers;
    } catch (error) {
      throw error;
    }
  }

  async findMyFollowings(user: User) {
    try {
      const results = await this.prismaService.follower.findMany({
        where: {
          followerUsername: user.username,
        },
        include: { following: true },
      });

      const followings: PublicUserResponseDto[] = [];

      results.forEach((result) => {
        const _user = new PublicUser(result.following);
        followings.push(_user.user);
      });

      return followings;
    } catch (error) {
      throw error;
    }
  }
}
