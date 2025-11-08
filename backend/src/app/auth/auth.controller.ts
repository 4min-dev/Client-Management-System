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
import { JwtAuthGuard } from '../../infrastructure/auth/jwt.guard';
import { LogInDto } from './dto/login.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../users/user.service';
import { WhoAmIResponseDto } from './dto/whoami.response';

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

  @Post('login/verify')
  async verifyLogin(@Body() dto: { code: string }) {
    return this.authService.verifyOTP(dto.code);
  }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Post('2fa/login')
  // signIn2FA(@Request() req, @Body() signInDto: LogIn2FADto) {
  //   return this.authService.logIn2FA(req.user.id, signInDto.code);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Get('2fa/generate')
  // async generate2FA(@Request() req): Promise<any> {
  //   var qr = await this.authService.generate2FAQR(req.user.id);

  //   const base64 = qr.split(',')[1];
  //   const buffer = Buffer.from(base64, 'base64');

  //   const stream = new PassThrough();
  //   stream.end(buffer);

  //   // return new StreamableFile(stream, {
  //   //   type: 'image/png',
  //   //   disposition: `inline; filename="${'2faQR.png'}"`,
  //   // });

  //   return { qr, id: req.user.id }
  // }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('whoami')
  async getProfile(@Request() req) {
    return new WhoAmIResponseDto(req.user.userId, req.user.login);
  }
}
