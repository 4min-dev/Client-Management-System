import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { UserService } from 'src/app/users/user.service';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class AuthHelper {
  private readonly jwtService: JwtService;

  constructor(
    private userService: UserService,
    private jwt: JwtService,
  ) {
    this.jwtService = jwt;
  }

  public async decode(token: string): Promise<unknown> {
    return this.jwtService.decode(token, null);
  }

  public async validateUser(decoded: any): Promise<User> {
    return await this.userService.find({ id: decoded.userId });
  }

  //Not used
  // public generateToken(user: User): string {
  //   return this.jwtService.sign({ id: user.id, login: user.login });
  // }

  public isPasswordValid(password: string, userPassword: string): boolean {
    return compareSync(password, userPassword);
  }

  public encodePassword(password: string): string {
    const salt: string = genSaltSync(10);

    return hashSync(password, salt);
  }

  private async validate(token: string): Promise<boolean | never> {
    const decoded: unknown = this.jwtService.verify(token);

    if (!decoded) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const user: User = await this.validateUser(decoded);

    if (!user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
