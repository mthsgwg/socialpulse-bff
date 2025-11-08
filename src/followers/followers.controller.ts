import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowersService } from './followers.service';
import { Prisma, User } from 'generated/prisma';
import { CreateFollowerDto } from './dto/create-follower.dto';

@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  private checkIfUserExists(user: User | null) {
    if (!user) throw new UnauthorizedException('Invalid user');

    return user;
  }

  @Post('follow')
  follow(@Body() createFollowerDto: CreateFollowerDto, @Req() req) {
    const user = this.checkIfUserExists(req?.user);
    return this.followersService.create(createFollowerDto, user);
  }

  @Delete('unfollow/:username')
  removeFollow(@Param('username') usernameToBeUnfollowed: string, @Req() req) {
    const user = this.checkIfUserExists(req?.user);
    return this.followersService.unfollow(usernameToBeUnfollowed, user);
  }

  @Get('my-followers')
  findFollowers(@Req() req) {
    const user = this.checkIfUserExists(req?.user);
    return this.followersService.findMyFollowers(user);
  }

  @Get('my-followings')
  findFollowings(@Req() req) {
    const user = this.checkIfUserExists(req?.user);
    return this.followersService.findMyFollowings(user);
  }
}
