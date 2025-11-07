import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    authenticate: jest.fn(),
    generateToken: jest.fn(),
  };

  const mockAuthDto = {
    email: 'test@example.com',
    password: 'plainPassword123',
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(mockAuthService).toBeDefined();
    });
  });

  describe('login()', () => {
    it('should return a token and user data on successful login', async () => {
      const mockToken = 'jwt-token-123';
      const expectedResponse = {
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        expiresIn: '14d',
      };

      mockAuthService.authenticate.mockResolvedValue(mockUser);
      mockAuthService.generateToken.mockReturnValue(mockToken);

      const result = await controller.login(mockAuthDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.authenticate).toHaveBeenCalledWith(mockAuthDto);
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error when user is undefined', async () => {
      mockAuthService.authenticate.mockResolvedValue(undefined);

      await expect(controller.login(mockAuthDto)).rejects.toThrow(
        'Authentication failed',
      );

      expect(mockAuthService.authenticate).toHaveBeenCalledWith(mockAuthDto);
      expect(mockAuthService.generateToken).not.toHaveBeenCalled();
    });

    it('should throw error when authentication fails', async () => {
      mockAuthService.authenticate.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(controller.login(mockAuthDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(mockAuthService.authenticate).toHaveBeenCalledWith(mockAuthDto);
      expect(mockAuthService.generateToken).not.toHaveBeenCalled();
    });
  });
});
