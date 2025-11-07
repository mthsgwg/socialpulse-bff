import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUserResponseDto } from './dto/public-user-response.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByUsername: jest.fn(),
    returnUser: jest.fn(),
  };

  const createUserDto: CreateUserDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
  };

  const publicUserResponseDto: PublicUserResponseDto = {
    createdAt: new Date(),
    updatedAt: new Date(),
    email: 'teste@teste.com',
    username: 'testes',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(mockUsersService).toBeDefined();
    });
  });

  describe('signup()', () => {
    it('should return a user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.signup(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException when user already exists', async () => {
      const conflictException = new ConflictException(
        'Username already exists',
      );
      mockUsersService.create.mockRejectedValue(conflictException);

      await expect(controller.signup(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne()', () => {
    it('should return user by username', async () => {
      mockUsersService.findOneByUsername.mockResolvedValue(
        publicUserResponseDto,
      );

      const result = await controller.findOne(mockUser.username);

      expect(result).toEqual(publicUserResponseDto);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(
        mockUser.username,
      );
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user does not exists', async () => {
      const notFoundError = new NotFoundException('User not found');
      mockUsersService.findOneByUsername.mockRejectedValue(notFoundError);

      await expect(controller.findOne('nonexistentuser')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(
        'nonexistentuser',
      );
    });

    it('should handle empty username parameter and throw NotFoundException', async () => {
      const emptyUsername = '';
      const notFoundError = new NotFoundException('User not found');

      mockUsersService.findOneByUsername.mockRejectedValue(notFoundError);

      await expect(controller.findOne('')).rejects.toThrow(NotFoundException);

      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(
        emptyUsername,
      );
    });
  });

  describe('getProfile()', () => {
    it('should return user if it is authenticated', async () => {
      const expectedUserProfile = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      };

      mockUsersService.returnUser.mockReturnValue(expectedUserProfile);

      const result = await controller.getProfile({ user: mockUser });

      expect(mockUsersService.returnUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedUserProfile);
    });

    it('should throw error when user is undefined', async () => {
      // O método returnUser lança exceção quando user é null
      mockUsersService.returnUser.mockImplementation(() => {
        throw new Error('User is not authenticated');
      });

      await expect(controller.getProfile({ user: null })).rejects.toThrow(
        'User is not authenticated',
      );

      expect(mockUsersService.returnUser).toHaveBeenCalledWith(null);
    });

    it('should throw error when request has no user', async () => {
      mockUsersService.returnUser.mockImplementation(() => {
        throw new Error('User is not authenticated');
      });

      await expect(controller.getProfile({})).rejects.toThrow(
        'User is not authenticated',
      );

      expect(mockUsersService.returnUser).toHaveBeenCalledWith(undefined);
    });
  });
});
