import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { PaymentStatus } from './enums/payment-status.enum';
import { EmailService } from '../shared/services/email.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    private readonly configService: ConfigService,
    private readonly coursesService: CoursesService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCheckoutSession(courseId: string, userId: string) {
    const course = await this.coursesService.findById(courseId, userId);
    const user = await this.usersService.findById(userId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.includes(courseId)) {
      throw new BadRequestException('Already enrolled in this course');
    }

    const payment = await this.paymentModel.create({
      course: courseId,
      user: userId,
      amount: course.price,
      status: PaymentStatus.PENDING,
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
              images: course.thumbnail ? [course.thumbnail] : [],
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get(
        'FRONTEND_URL',
      )}/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get(
        'FRONTEND_URL',
      )}/courses/${courseId}/cancel`,
      metadata: {
        courseId,
        userId,
        paymentId: payment._id.toString(),
      },
    });

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      stripeSessionId: session.id,
    });

    return { sessionId: session.id, sessionUrl: session.url };
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleSuccessfulPayment(session);
      }

      // console.log('event', event);

      return { received: true };
    } catch (err) {
      console.log('err', err);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  private async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const { courseId, userId, paymentId } = session.metadata;

    console.log('courseId', courseId);
    console.log('userId', userId);
    console.log('paymentId', paymentId);

    await this.paymentModel.findByIdAndUpdate(paymentId, {
      status: PaymentStatus.COMPLETED,
      stripePaymentIntentId: session.payment_intent as string,
    });

    await this.usersService.enrollInCourse(userId, courseId);

    const user = await this.usersService.findById(userId);
    const course = await this.coursesService.findById(courseId, userId);

    // Send payment and enrollment confirmation emails
    await Promise.all([
      this.emailService.sendPaymentConfirmation(user.email),
      this.emailService.sendEnrollmentConfirmation(user.email),
    ]);
  }

  async getPaymentHistory(userId: string) {
    return this.paymentModel
      .find({ user: userId })
      .populate('course', 'title price')
      .sort({ createdAt: -1 });
  }
}
