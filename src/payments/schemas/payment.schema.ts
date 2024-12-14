import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Course } from '../../courses/schemas/course.schema';
import { PaymentStatus } from '../enums/payment-status.enum';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: Course;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  stripeSessionId?: string;

  @Prop()
  stripePaymentIntentId?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
