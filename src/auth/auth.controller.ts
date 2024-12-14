import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req.user['id']);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    const userId = req.user['id'];
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
