export class LoginResponseDto {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  expiresIn: string;
}
