import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    CoursesModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
