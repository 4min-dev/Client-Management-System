import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';

@Injectable()
export class Jwt2faAuthGuard extends AuthGuard('jwt2fa') {
  public handleRequest(err: unknown, user: User): any {
    return user;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    //@ts-ignore
    const { user }: Request = context.switchToHttp().getRequest();

    return user ? true : false;
  }
}
