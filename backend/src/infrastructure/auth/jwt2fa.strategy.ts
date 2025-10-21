//@ts-ignore
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { UserService } from 'src/app/users/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt2fa') {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log("🚀 ~ Jwt2faStrategy ~ validate ~ payload:", payload)
    const user = await this.userService.find({id: payload.userId});

    if (!user.twoFAEnabled) {
      return user;
    }

    if (payload.isTwoFactorAuthenticated) {
      return user;
    }
  }
}
