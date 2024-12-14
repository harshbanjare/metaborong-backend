import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRegistrationDto } from './dto/user-registration.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async registerUser(@Body() registrationDto: UserRegistrationDto) {
    return this.usersService.register(registrationDto);
  }
}
