// src/infrastructure/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // ← ЭТОТ МЕТОД ВОЗВРАЩАЕТ req.user
  async validate(payload: any) {
    return {
      userId: payload.userId,   // ← Теперь есть
      login: payload.login,     // ← Теперь есть
      // sub: payload.sub,      // ← Больше не нужен
    };
  }
}