import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<object> {
    return await this.authService.signup(signUpDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  signIn(@Request() req: any): object {
    return this.authService.signIn(req.user.id);
  }

  @Post('/refresh')
  async refresh(@Headers('Authorization') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }
}
