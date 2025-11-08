import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { authenticator } from 'otplib';
import { UserService } from 'src/app/users/user.service';
import { toDataURL } from 'qrcode';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { expiresAt: number; userId: string }>();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
  ) { }

  async logIn(login: string, password: string): Promise<{ message: string; userId: string }> {
    const user = await this.userService.find({ login });

    if (!user || !(await compare(password, user.password))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const code = this.generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otpStore.set(code, { expiresAt, userId: user.id });

    await this.emailService.sendOTP(code);

    return {
      message: 'Код отправлен на корпоративную почту',
      userId: user.id,
    };
  }

  async verifyOTP(code: string): Promise<{ accessToken: string }> {
    const stored = this.otpStore.get(code);

    if (!stored) {
      throw new BadRequestException('Код не найден');
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(code);
      throw new BadRequestException('Код истёк');
    }

    this.otpStore.delete(code);

    const user = await this.userService.find({ id: stored.userId });
    const payload = {
      login: user.login,
      sub: user.id,
      userId: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // async logIn2FA(userId: string, code: string): Promise<any> {
  //   const user = await this.userService.find({
  //     id: userId,
  //   });

  //   if (user.twoFASecret == null) {
  //     throw new UnauthorizedException('2FA is disabled');
  //   }

  //   const isCodeValid = authenticator.verify({
  //     token: code,
  //     secret: user.twoFASecret,
  //   });

  //   if (isCodeValid) {
  //     const twoFAPayload = this.generateAccessTokenPayload(user.login, userId, true);

  //     return {
  //       is2faJWT: true,
  //       accessToken: this.jwtService.sign(twoFAPayload),
  //       twoFASecret: user.twoFASecret
  //     };
  //   }

  //   throw new UnauthorizedException('Wrong authentication code');
  // }

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

  // async generate2FAQR(userId: string): Promise<string> {
  //   const user = await this.userService.find({
  //     id: userId,
  //   });

  //   const { otpAuthUrl } = await this._generateTwoFactorAuthenticationSecret(
  //     userId,
  //     user.login,
  //   );

  //   return toDataURL(otpAuthUrl);
  // }
}