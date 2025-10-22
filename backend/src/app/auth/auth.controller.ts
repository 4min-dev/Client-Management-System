import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/jwt.guard';
import { LogInDto } from 'src/app/auth/dto/login.dto';
import { Jwt2faAuthGuard } from 'src/infrastructure/auth/jwt2fa.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LogIn2FADto } from 'src/app/auth/dto/login2fa.dto';
import { createReadStream } from 'fs';
import { PassThrough } from 'stream';
import { UserService } from 'src/app/users/user.service';
import { WhoAmIResponseDto } from 'src/app/auth/dto/whoami.response';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) { }

  @Post('login')
  signIn(@Body() signInDto: LogInDto) {
    return this.authService.logIn(signInDto.login, signInDto.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/login')
  signIn2FA(@Request() req, @Body() signInDto: LogIn2FADto) {
    return this.authService.logIn2FA(req.user.id, signInDto.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('2fa/generate')
  async generate2FA(@Request() req): Promise<any> {
    var qr = await this.authService.generate2FAQR(req.user.id);

    const base64 = qr.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    const stream = new PassThrough();
    stream.end(buffer);

    // return new StreamableFile(stream, {
    //   type: 'image/png',
    //   disposition: `inline; filename="${'2faQR.png'}"`,
    // });

    return { qr, id: req.user.id }
  }

  @ApiBearerAuth()
  @UseGuards(Jwt2faAuthGuard)
  @Get('whoami')
  async getProfile(@Request() req) {
    var user = await this.userService.find({ id: req.user.id });

    return new WhoAmIResponseDto(user.id, user.login);
  }
}
