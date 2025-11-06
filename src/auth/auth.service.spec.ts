import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';

// Mock modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockBcrypt = require('bcrypt');
const mockJsonwebtoken = require('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  // Dados de teste
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validAuthDto: CreateAuthDto = {
    email: 'test@example.com',
    password: 'plainPassword123',
  };

  const invalidAuthDto: CreateAuthDto = {
    email: 'nonexistent@example.com',
    password: 'wrongPassword',
  };

  beforeEach(async () => {
    // Configurar ambiente de teste
    process.env.JWT_SECRET = 'test-jwt-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpar variáveis de ambiente após cada teste
    delete process.env.JWT_SECRET;
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
      expect(prismaService).toBeDefined();
    });
  });

  describe('authenticate()', () => {
    it('should authenticate user with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authService.authenticate(validAuthDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validAuthDto.email },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validAuthDto.password,
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.authenticate(invalidAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: invalidAuthDto.email },
      });
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.authenticate(validAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validAuthDto.email },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validAuthDto.password,
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException with correct message for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      try {
        await authService.authenticate(invalidAuthDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
      }
    });
  });

  describe('generateToken()', () => {
    const userId = 'user-123';
    const mockToken = 'mock.jwt.token';

    it('should generate JWT token with valid userId', () => {
      mockJsonwebtoken.sign.mockReturnValue(mockToken);

      const result = authService.generateToken(userId);

      expect(mockJsonwebtoken.sign).toHaveBeenCalledWith(
        { sub: userId },
        'test-jwt-secret-key',
        { expiresIn: '14d' },
      );
      expect(result).toBe(mockToken);
    });

    it('should throw UnauthorizedException when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => authService.generateToken(userId)).toThrow(
        UnauthorizedException,
      );
      expect(() => authService.generateToken(userId)).toThrow(
        'JWT configuration is missing',
      );
    });

    it('should generate different tokens for different users', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const token1 = 'token.for.user1';
      const token2 = 'token.for.user2';

      mockJsonwebtoken.sign
        .mockReturnValueOnce(token1)
        .mockReturnValueOnce(token2);

      const result1 = authService.generateToken(userId1);
      const result2 = authService.generateToken(userId2);

      expect(result1).toBe(token1);
      expect(result2).toBe(token2);
      expect(mockJsonwebtoken.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full authentication flow', async () => {
      const mockToken = 'complete.flow.token';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJsonwebtoken.sign.mockReturnValue(mockToken);

      const authenticatedUser = await authService.authenticate(validAuthDto);

      expect(authenticatedUser).toEqual(mockUser);

      if (authenticatedUser) {
        const token = authService.generateToken(authenticatedUser.id);

        expect(token).toBe(mockToken);
      }

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockJsonwebtoken.sign).toHaveBeenCalledTimes(1);
    });
  });
});
