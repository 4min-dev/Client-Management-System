import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';

//@ts-ignore
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthHelper } from 'src/infrastructure/auth/auth.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  private validate(payload: any): Promise<User | never> {
    return this.helper.validateUser(payload);
  }
}
