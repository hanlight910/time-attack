import { PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/user/entities/user.entity';

export class SignUpDto extends PickType(User, ['email', 'password', 'name']) {
  @IsNotEmpty({ message: '작성하지 않는 항목이 존재합니다.' })
  @IsString()
  passwordConfirm: string;
}
