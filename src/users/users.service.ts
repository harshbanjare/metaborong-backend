import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { UserRegistrationDto } from './dto/user-registration.dto';
import { EmailService } from '../shared/services/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async register(registrationDto: UserRegistrationDto) {
    const { email, password, ...rest } = registrationDto;

    // Check email uniqueness
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userModel.create({
      ...rest,
      email,
      password: hashedPassword,
    });

    // Remove password from response
    const { password: _, ...result } = user.toJSON();

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return result;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { enrolledCourses: courseId },
      },
      { new: true },
    );
  }
}
