import { User } from 'generated/prisma';

export class PublicUser {
  constructor(private _user: User) {}

  get user() {
    return {
      username: this._user.username,
      email: this._user.email,
      createdAt: this._user.createdAt,
      updatedAt: this._user.updatedAt,
    };
  }
}
