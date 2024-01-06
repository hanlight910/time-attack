import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { compareSync, hashSync } from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async signup({ email, name, password, passwordConfirm }: SignUpDto) {
    const existedUser = await this.userRepository.findOneBy({ email });

    if (existedUser) 
      throw new BadRequestException('이미 가입된 이메일입니다.');
    
    if (password !== passwordConfirm) 
      throw new BadRequestException('비밀번호가 서로 일치하지 않습니다.')

    const hashRound = parseInt(this.configService.get<string>('PASSWORD_HASH_ROUNDS'));
    const hashedPassword = hashSync(password, hashRound);

    const user = await this.userRepository.save({
      email,
      password: hashedPassword,
      name,
    });

    return this.signIn(user.id);
  }

  async signIn(id: number) {
    const accessToken = this.jwtService.sign({ id });

    const refreshToken = this.jwtService.sign({ id }, { expiresIn: '1d' });

    await this.userRepository.update(id, { refreshToken: refreshToken });

    return { accessToken, refreshToken };
  }

  async validateUser({ email, password }: SignInDto) {
    const user = await this.userRepository.findOne({
      where: { email: email },
      select: { id: true, password: true
    }
    });

    const isPasswordMatched = compareSync(password, user.password);

    if (!user) 
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.')
    if (!isPasswordMatched) 
      throw new BadRequestException('패스워드가 서로 일치하지 않습니다.')
   
    return { id: user.id };
  }

  async refreshToken(refreshToken: string) {
      const { id } = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOneBy({ id });
    
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('토큰이 유효하지 않습니다.');
      }

      const accessToken = this.jwtService.sign({ id });

      return { accessToken };
  }
}
