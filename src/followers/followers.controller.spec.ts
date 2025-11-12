import { Test, TestingModule } from '@nestjs/testing';
import { FollowersController } from './followers.controller';
import { FollowersService } from './followers.service';
import { CreateFollowerDto } from './dto/create-follower.dto';
import {
  UnauthorizedException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { PublicUserResponseDto } from 'src/users/dto/public-user-response.dto';

describe('FollowersController', () => {
  let controller: FollowersController;
  let followersService: FollowersService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUser2 = {
    id: 'user-124',
    email: 'test2@example.com',
    username: 'testuser2',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReqUser = {
    user: mockUser,
  };

  const mockFollowersService = {
    create: jest.fn(),
    unfollow: jest.fn(),
    findMyFollowers: jest.fn(),
    findMyFollowings: jest.fn(),
  };

  const mockCreateFollowerDto: CreateFollowerDto = {
    followerUsername: 'testuser',
    followingUsername: 'testuser2',
  };

  const mockFollowerRecord = {
    id: 'follower-123',
    followerUsername: 'testuser',
    followingUsername: 'testuser2',
    createdAt: new Date('2025-01-01'),
  };

  const mockPublicUserResponse: PublicUserResponseDto = {
    username: mockUser2.username,
    email: mockUser2.email,
    createdAt: mockUser2.createdAt,
    updatedAt: mockUser2.updatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowersController],
      providers: [
        {
          provide: FollowersService,
          useValue: mockFollowersService,
        },
      ],
    }).compile();

    followersService = module.get<FollowersService>(FollowersService); // ✅ Adicionar
    controller = module.get<FollowersController>(FollowersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(followersService).toBeDefined();
    });
  });

  describe('follow', () => {
    it('should create a follow relationship successfully and return a follower record', async () => {
      mockFollowersService.create.mockResolvedValue(mockFollowerRecord);

      const result = await controller.follow(
        mockCreateFollowerDto,
        mockReqUser,
      );

      expect(mockFollowersService.create).toHaveBeenCalledWith(
        mockCreateFollowerDto,
        mockUser,
      );
      expect(result).toEqual(mockFollowerRecord);
    });

    it('should throw UnauthorizedException when req is undefined', async () => {
      try {
        await controller.follow(mockCreateFollowerDto, undefined);
        fail('Expected exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid user');
        expect(mockFollowersService.create).not.toHaveBeenCalled();
      }
    });
  });

  describe('unfollow', () => {
    it('should return return follower record', async () => {
      mockFollowersService.unfollow.mockResolvedValue(mockFollowerRecord);
      const result = await controller.removeFollow(
        mockUser2.username,
        mockReqUser,
      );

      expect(result).toEqual(mockFollowerRecord);
      expect(mockFollowersService.unfollow).toHaveBeenCalledWith(
        mockUser2.username,
        mockUser,
      );
    });

    it('should throw HttpException', async () => {
      const httpException = new HttpException('User relation not found', 404);
      mockFollowersService.unfollow.mockRejectedValue(httpException);

      await expect(
        controller.removeFollow('nonexistinguser', mockReqUser),
      ).rejects.toThrow('User relation not found');
    });

    it('should throw UnauthorizedException when req is undefined', async () => {
      try {
        await controller.removeFollow(mockUser2.username, undefined);
        fail('Expected exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid user');
        expect(mockFollowersService.unfollow).not.toHaveBeenCalled();
      }
    });
  });

  describe('findFollowers', () => {
    it('should return array of public followers', async () => {
      mockFollowersService.findMyFollowers.mockResolvedValue([
        mockPublicUserResponse,
      ]);

      const result = await controller.findFollowers(mockReqUser);

      expect(result).toEqual([mockPublicUserResponse]);
      expect(mockFollowersService.findMyFollowers).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should return empty array when no followers', async () => {
      mockFollowersService.findMyFollowers.mockResolvedValue([]);

      const result = await controller.findFollowers(mockReqUser);

      expect(result).toEqual([]);
      expect(mockFollowersService.findMyFollowers).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should throw UnauthorizedException when req is undefined', async () => {
      try {
        await controller.findFollowers(undefined);
        fail('Expected exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid user');
        expect(mockFollowersService.findMyFollowers).not.toHaveBeenCalled();
      }
    });
  });

  describe('findFollowings', () => {
    it('should return who i follow', async () => {
      mockFollowersService.findMyFollowings.mockResolvedValue([
        mockPublicUserResponse,
      ]);

      const result = await controller.findFollowings(mockReqUser);

      expect(result).toEqual([mockPublicUserResponse]);
      expect(mockFollowersService.findMyFollowings).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should return empty array when i follow no one', async () => {
      mockFollowersService.findMyFollowings.mockResolvedValue([]);

      const result = await controller.findFollowings(mockReqUser);

      expect(result).toEqual([]);
      expect(mockFollowersService.findMyFollowings).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should throw UnauthorizedException when req is undefined', async () => {
      try {
        await controller.findFollowings(undefined);
        fail('Expected exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid user');
        expect(mockFollowersService.findMyFollowings).not.toHaveBeenCalled();
      }
    });
  });
});
