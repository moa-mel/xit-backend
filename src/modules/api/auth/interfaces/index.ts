import { Prisma, User } from '@prisma/client';


import { Request } from 'express';


export interface LoginMeta {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: User;
}

export interface DataStoredInToken {
  sub: string;
}
