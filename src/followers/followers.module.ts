import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { FollowersController } from './followers.controller';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  controllers: [FollowersController],
  providers: [FollowersService],
})
export class FollowersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/followers/*');
  }
}
