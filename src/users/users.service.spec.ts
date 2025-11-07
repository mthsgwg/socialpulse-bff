import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { PublicUserResponseDto } from './dto/public-user-response.dto';

jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const hashedPassword = 'hashedPassowrd123';

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const createUserDto: CreateUserDto = {
    username: 'teste',
    email: 'teste@teste.com',
    password: '123123',
  };

  const mockUser = {
    id: '123-213',
    username: 'teste',
    email: 'teste@teste.com',
    password: 'hashedPassowrd123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      (expect(service).toBeDefined(), expect(prismaService).toBeDefined());
    });
  });

  describe('create()', () => {
    it('should create user successfully', async () => {
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException when username already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['username'] },
        },
      );

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Username already exists',
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('findOneByUsername()', () => {
    it('should return user by username', async () => {
      const publicUserResponseDto: PublicUserResponseDto = {
        username: mockUser.username,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneByUsername(mockUser.username);

      expect(result).toEqual(publicUserResponseDto);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockUser.username },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOneByUsername('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByUsername('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('returnUser()', () => {
    it('should return user without password', () => {
      const { password, ...user } = mockUser;

      const result = service.returnUser(user as any);

      expect(result).toEqual(user);
    });
  });
});
