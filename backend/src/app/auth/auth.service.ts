import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { authenticator } from 'otplib';
import { UserService } from 'src/app/users/user.service';
import { toDataURL } from 'qrcode';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async logIn(login: string, pass: string): Promise<any> {
    const user = await this.userService.find({
      login: login,
    });

    if (user && compare(user.password, pass)) {
      return this._generateToken(user.id, user.login);
    }

    throw new UnauthorizedException('Wrong password or login');
  }

  async logIn2FA(userId: string, code: string): Promise<any> {
    const user = await this.userService.find({
      id: userId,
    });

    if (user.twoFASecret == null) {
      throw new UnauthorizedException('2FA is disabled');
    }

    const isCodeValid = authenticator.verify({
      token: code,
      secret: user.twoFASecret,
    });

    if (isCodeValid) {
      const twoFAPayload = this.generateAccessTokenPayload(user.login, userId, true);

      return {
        is2faJWT: true,
        accessToken: this.jwtService.sign(twoFAPayload),
        twoFASecret: user.twoFASecret
      };
    }

    throw new UnauthorizedException('Wrong authentication code');
  }

  async _generateToken(
    userId: string,
    login: string,
  ): Promise<{ accessToken: String }> {
    const payload = this.generateAccessTokenPayload(login, userId, false);

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private generateAccessTokenPayload(
    login: string,
    id: string,
    isTwoFactorAuthenticated: boolean,
  ) {
    return {
      login: login,
      sub: id,
      userId: id,
      isTwoFactorAuthenticated: isTwoFactorAuthenticated,
    };
  }

  async _generateTwoFactorAuthenticationSecret(userId: string, login: string) {
    const secret = authenticator.generateSecret();

    const otpAuthUrl = authenticator.keyuri(
      login,
      this.configService.get('APP_NAME'),
      secret,
    );

    await this.userService.setTwoFactorAuthenticationSecret(secret, userId);

    return {
      secret,
      otpAuthUrl,
    };
  }

  async generate2FAQR(userId: string): Promise<string> {
    const user = await this.userService.find({
      id: userId,
    });

    const { otpAuthUrl } = await this._generateTwoFactorAuthenticationSecret(
      userId,
      user.login,
    );

    return toDataURL(otpAuthUrl);
  }
}
